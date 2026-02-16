import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple password hashing using Web Crypto API (no external deps)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

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
      const hashedInput = await hashPassword(password);
      let valid = false;

      // Check if password is already hashed (64 char hex = SHA-256)
      if (appUser.password.length === 64 && /^[0-9a-f]+$/.test(appUser.password)) {
        valid = appUser.password === hashedInput;
      } else {
        // Legacy plaintext comparison, then hash and update
        valid = appUser.password === password;
        if (valid) {
          await supabase
            .from("app_users")
            .update({ password: hashedInput })
            .eq("username", trimmedUsername);
        }
      }

      if (valid) {
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
      const hashedInput = await hashPassword(password);
      let valid = false;

      if (tech.password.length === 64 && /^[0-9a-f]+$/.test(tech.password)) {
        valid = tech.password === hashedInput;
      } else {
        valid = tech.password === password;
        if (valid) {
          await supabase
            .from("technicians")
            .update({ password: hashedInput })
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
  } catch (err) {
    console.error("Auth error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Erro ao processar solicitação" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
