import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { titulo, conteudo, target_user_ids, campanha_id } = await req.json();

    if (!titulo || !conteudo) {
      return new Response(
        JSON.stringify({ error: "titulo and conteudo required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") || "";
    const rawPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") || "";
    // Sanitize keys: remove padding, whitespace, quotes, make URL-safe
    const sanitizeKey = (key: string) => key.replace(/[\s"'`\u200B\uFEFF]/g, "").replace(/=+$/, "");
    const VAPID_PUBLIC_KEY = sanitizeKey(rawPublicKey);
    const VAPID_PRIVATE_KEY = sanitizeKey(rawPrivateKey);

    // Sanitize VAPID_SUBJECT
    const rawSubject = Deno.env.get("VAPID_SUBJECT") || "";
    const VAPID_SUBJECT = rawSubject
      .replace(/[\u200B\u200C\u200D\uFEFF\u00A0]/g, "")
      .replace(/[<>"'`]/g, "")
      .replace(/\s+/g, "")
      .trim() || "mailto:nailton.alsampaio@gmail.com";

    console.log("VAPID keys lengths:", VAPID_PUBLIC_KEY.length, VAPID_PRIVATE_KEY.length);
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

    // Use service role to query subscriptions
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let query = adminClient.from("push_subscriptions").select("*");

    if (target_user_ids && target_user_ids.length > 0) {
      query = query.in("user_id", target_user_ids);
    } else if (campanha_id) {
      const { data: campaignUsers } = await adminClient
        .from("profiles")
        .select("id")
        .eq("campanha_id", campanha_id);

      if (campaignUsers && campaignUsers.length > 0) {
        query = query.in("user_id", campaignUsers.map((u: any) => u.id));
      }
    }

    const { data: subscriptions, error: subError } = await query;

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscriptions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ enviados: 0, falhas: 0, total: 0, message: "Nenhuma inscrição push encontrada" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = JSON.stringify({
      title: titulo,
      body: conteudo.length > 200 ? conteudo.substring(0, 200) + "..." : conteudo,
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      data: { url: "/mensagens" },
    });

    let enviados = 0;
    let falhas = 0;
    const staleEndpoints: string[] = [];

    for (const sub of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth_key },
        };

        await webpush.sendNotification(pushSubscription, payload);
        enviados++;
      } catch (err: any) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          staleEndpoints.push(sub.endpoint);
        }
        console.error(`Push failed for ${sub.endpoint}:`, err.statusCode || err.message);
        falhas++;
      }
    }

    // Cleanup expired subscriptions
    if (staleEndpoints.length > 0) {
      await adminClient
        .from("push_subscriptions")
        .delete()
        .in("endpoint", staleEndpoints);
    }

    return new Response(
      JSON.stringify({ enviados, falhas, total: subscriptions.length, removidos: staleEndpoints.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("send-push error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
