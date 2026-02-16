import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ success: false, error: "Credenciais obrigatórias" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate input lengths
    if (typeof username !== "string" || typeof password !== "string" || username.length > 100 || password.length > 200) {
      return new Response(
        JSON.stringify({ success: false, error: "Credenciais inválidas" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const trimmedUsername = username.trim();

    // Check app_users table
    const { data: appUser } = await supabase
      .from("app_users")
      .select("username, role, password")
      .eq("username", trimmedUsername)
      .maybeSingle();

    if (appUser) {
      let valid = false;
      if (appUser.password.startsWith("$2")) {
        // Already hashed — compare with bcrypt
        valid = await bcrypt.compare(password, appUser.password);
      } else {
        // Legacy plaintext — compare directly, then hash and update
        valid = appUser.password === password;
        if (valid) {
          const hashed = await bcrypt.hash(password);
          await supabase
            .from("app_users")
            .update({ password: hashed })
            .eq("username", trimmedUsername);
        }
      }

      if (valid) {
        // Generate a simple session token
        const sessionToken = crypto.randomUUID();
        return new Response(
          JSON.stringify({
            success: true,
            user: appUser.username,
            role: appUser.role,
            sessionToken,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Check technicians table
    const { data: tech } = await supabase
      .from("technicians")
      .select("name, username, password")
      .eq("username", trimmedUsername)
      .maybeSingle();

    if (tech && tech.password) {
      let valid = false;
      if (tech.password.startsWith("$2")) {
        valid = await bcrypt.compare(password, tech.password);
      } else {
        valid = tech.password === password;
        if (valid) {
          const hashed = await bcrypt.hash(password);
          await supabase
            .from("technicians")
            .update({ password: hashed })
            .eq("username", trimmedUsername);
        }
      }

      if (valid) {
        const sessionToken = crypto.randomUUID();
        return new Response(
          JSON.stringify({
            success: true,
            user: tech.name,
            role: "technician",
            sessionToken,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: "Credenciais inválidas" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: "Erro ao processar solicitação" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
