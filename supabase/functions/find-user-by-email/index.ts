import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase env is not configured");
    }

    const authHeader = req.headers.get("Authorization") || "";
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: authData } = await supabaseAdmin.auth.getUser();
    const caller = authData?.user;
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Allow only teacher/admin callers
    const { data: roleRow } = await (supabaseAdmin as any)
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .maybeSingle();
    const role = roleRow?.role;
    if (role !== "teacher" && role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const email = String(body?.email || "").trim().toLowerCase();
    if (!email) throw new Error("Missing email");

    // Fast path: query auth.users via SECURITY DEFINER SQL function
    const { data: rpcUserId, error: rpcErr } = await (supabaseAdmin as any).rpc("get_user_id_by_email", {
      p_email: email,
    });

    if (!rpcErr && rpcUserId) {
      // best-effort: sync profiles.email if missing
      await (supabaseAdmin as any)
        .from("profiles")
        .update({ email })
        .eq("user_id", rpcUserId)
        .is("email", null);

      return new Response(JSON.stringify({ userId: rpcUserId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Search in auth users (paged)
    const perPage = 200;
    for (let page = 1; page <= 10; page++) {
      const { data } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
      const found = data?.users?.find((u) => (u.email || "").toLowerCase() === email);
      if (found) {
        // best-effort: sync profiles.email if missing
        await (supabaseAdmin as any)
          .from("profiles")
          .update({ email })
          .eq("user_id", found.id)
          .is("email", null);

        return new Response(JSON.stringify({ userId: found.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!data?.users || data.users.length < perPage) break;
    }

    return new Response(JSON.stringify({ userId: null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

