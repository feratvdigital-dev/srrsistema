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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let migratedCount = 0;

    // Hash app_users passwords
    const { data: appUsers } = await supabase.from("app_users").select("id, password");
    if (appUsers) {
      for (const user of appUsers) {
        if (user.password && !user.password.startsWith("$2")) {
          const hashed = await bcrypt.hash(user.password);
          await supabase.from("app_users").update({ password: hashed }).eq("id", user.id);
          migratedCount++;
        }
      }
    }

    // Hash technicians passwords
    const { data: techs } = await supabase.from("technicians").select("id, password");
    if (techs) {
      for (const tech of techs) {
        if (tech.password && !tech.password.startsWith("$2")) {
          const hashed = await bcrypt.hash(tech.password);
          await supabase.from("technicians").update({ password: hashed }).eq("id", tech.id);
          migratedCount++;
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, migratedCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: "Erro ao processar migração" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
