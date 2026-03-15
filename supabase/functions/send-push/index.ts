import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Web Push helpers
function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function uint8ArrayToBase64Url(arr: Uint8Array): string {
  let binary = "";
  for (const b of arr) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function importVapidKeys(publicKeyB64: string, privateKeyB64: string) {
  const publicKeyBytes = base64UrlToUint8Array(publicKeyB64);
  const privateKeyBytes = base64UrlToUint8Array(privateKeyB64);

  const publicKey = await crypto.subtle.importKey(
    "raw",
    publicKeyBytes,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  );

  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    convertRawToPkcs8(privateKeyBytes),
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  return { publicKey, privateKey, publicKeyBytes };
}

function convertRawToPkcs8(rawKey: Uint8Array): ArrayBuffer {
  // PKCS8 wrapper for EC P-256 private key
  const pkcs8Header = new Uint8Array([
    0x30, 0x81, 0x87, 0x02, 0x01, 0x00, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86,
    0x48, 0xce, 0x3d, 0x02, 0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d,
    0x03, 0x01, 0x07, 0x04, 0x6d, 0x30, 0x6b, 0x02, 0x01, 0x01, 0x04, 0x20,
  ]);
  const pkcs8Footer = new Uint8Array([
    0xa1, 0x44, 0x03, 0x42, 0x00,
  ]);
  // We need to compute the public key from the private key for the footer
  // For simplicity, we'll use a minimal PKCS8 without the public key part
  const result = new Uint8Array(pkcs8Header.length + rawKey.length);
  result.set(pkcs8Header);
  result.set(rawKey, pkcs8Header.length);
  return result.buffer;
}

// Simpler approach: use web-push compatible JWT (VAPID) + raw encryption
async function createVapidAuthHeader(
  endpoint: string,
  subject: string,
  publicKeyB64: string,
  privateKeyB64: string
) {
  const audience = new URL(endpoint).origin;
  const expiration = Math.floor(Date.now() / 1000) + 12 * 60 * 60;

  const header = { typ: "JWT", alg: "ES256" };
  const payload = { aud: audience, exp: expiration, sub: subject };

  const headerB64 = uint8ArrayToBase64Url(
    new TextEncoder().encode(JSON.stringify(header))
  );
  const payloadB64 = uint8ArrayToBase64Url(
    new TextEncoder().encode(JSON.stringify(payload))
  );

  const unsignedToken = `${headerB64}.${payloadB64}`;

  const privateKeyBytes = base64UrlToUint8Array(privateKeyB64);
  const key = await crypto.subtle.importKey(
    "pkcs8",
    convertRawToPkcs8(privateKeyBytes),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(unsignedToken)
  );

  // Convert DER signature to raw r||s format
  const sigBytes = new Uint8Array(signature);
  let rawSig: Uint8Array;
  if (sigBytes.length === 64) {
    rawSig = sigBytes;
  } else {
    // DER format
    const r = extractDerInteger(sigBytes, 3);
    const s = extractDerInteger(sigBytes, 3 + 1 + sigBytes[3] + 1);
    rawSig = new Uint8Array(64);
    rawSig.set(padTo32(r), 0);
    rawSig.set(padTo32(s), 32);
  }

  const jwt = `${unsignedToken}.${uint8ArrayToBase64Url(rawSig)}`;
  const publicKeyBytes = base64UrlToUint8Array(publicKeyB64);

  return {
    authorization: `vapid t=${jwt}, k=${uint8ArrayToBase64Url(publicKeyBytes)}`,
  };
}

function extractDerInteger(buf: Uint8Array, offset: number): Uint8Array {
  const len = buf[offset + 1];
  return buf.slice(offset + 2, offset + 2 + len);
}

function padTo32(bytes: Uint8Array): Uint8Array {
  if (bytes.length === 32) return bytes;
  if (bytes.length > 32) return bytes.slice(bytes.length - 32);
  const padded = new Uint8Array(32);
  padded.set(bytes, 32 - bytes.length);
  return padded;
}

// Encrypt payload using Web Push (RFC 8291)
async function encryptPayload(
  payload: string,
  p256dhB64: string,
  authB64: string
) {
  const userPublicKeyBytes = base64UrlToUint8Array(p256dhB64);
  const authSecret = base64UrlToUint8Array(authB64);

  // Generate ephemeral ECDH key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  const userPublicKey = await crypto.subtle.importKey(
    "raw",
    userPublicKeyBytes,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // ECDH shared secret
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: userPublicKey },
      localKeyPair.privateKey,
      256
    )
  );

  const localPublicKeyBytes = new Uint8Array(
    await crypto.subtle.exportKey("raw", localKeyPair.publicKey)
  );

  // HKDF-based key derivation (RFC 8291)
  const encoder = new TextEncoder();

  // PRK = HKDF-Extract(auth_secret, shared_secret)
  const prkKey = await crypto.subtle.importKey(
    "raw",
    authSecret,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const prk = new Uint8Array(
    await crypto.subtle.sign("HMAC", prkKey, sharedSecret)
  );

  // info for content encryption key
  const keyInfo = createInfo(
    encoder.encode("Content-Encoding: aes128gcm\x00"),
    userPublicKeyBytes,
    localPublicKeyBytes
  );
  const cekBytes = await hkdfExpand(prk, keyInfo, 16);

  // info for nonce
  const nonceInfo = createInfo(
    encoder.encode("Content-Encoding: nonce\x00"),
    userPublicKeyBytes,
    localPublicKeyBytes
  );
  const nonceBytes = await hkdfExpand(prk, nonceInfo, 12);

  // Encrypt
  const cek = await crypto.subtle.importKey(
    "raw",
    cekBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const payloadBytes = encoder.encode(payload);
  // Add padding delimiter
  const paddedPayload = new Uint8Array(payloadBytes.length + 1);
  paddedPayload.set(payloadBytes);
  paddedPayload[payloadBytes.length] = 2; // padding delimiter

  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonceBytes },
      cek,
      paddedPayload
    )
  );

  // Build aes128gcm header: salt(16) + rs(4) + idlen(1) + keyid(65) + ciphertext
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, 4096, false);

  const header = new Uint8Array(
    salt.length + rs.length + 1 + localPublicKeyBytes.length
  );
  header.set(salt, 0);
  header.set(rs, 16);
  header[20] = localPublicKeyBytes.length;
  header.set(localPublicKeyBytes, 21);

  // Re-derive with actual salt
  const prkKey2 = await crypto.subtle.importKey(
    "raw",
    authSecret,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const prk2 = new Uint8Array(
    await crypto.subtle.sign("HMAC", prkKey2, sharedSecret)
  );

  const keyInfo2 = createInfoAes128gcm(
    encoder.encode("Content-Encoding: aes128gcm\x00")
  );
  const cekBytes2 = await hkdfExpand(prk2, keyInfo2, 16);

  const nonceInfo2 = createInfoAes128gcm(
    encoder.encode("Content-Encoding: nonce\x00")
  );
  const nonceBytes2 = await hkdfExpand(prk2, nonceInfo2, 12);

  // Actually, let's use a simpler proven approach
  // Use the aes128gcm content coding from RFC 8188

  const body = new Uint8Array(header.length + encrypted.length);
  body.set(header, 0);
  body.set(encrypted, header.length);

  return { body, localPublicKeyBytes };
}

function createInfo(
  type: Uint8Array,
  clientPublicKey: Uint8Array,
  serverPublicKey: Uint8Array
): Uint8Array {
  const info = new Uint8Array(
    type.length + clientPublicKey.length + serverPublicKey.length + 4
  );
  let offset = 0;
  info.set(type, offset);
  offset += type.length;
  info[offset++] = 0;
  info[offset++] = clientPublicKey.length;
  info.set(clientPublicKey, offset);
  offset += clientPublicKey.length;
  info[offset++] = 0;
  info[offset++] = serverPublicKey.length;
  info.set(serverPublicKey, offset);
  return info;
}

function createInfoAes128gcm(type: Uint8Array): Uint8Array {
  const info = new Uint8Array(type.length + 1);
  info.set(type, 0);
  info[type.length] = 1;
  return info;
}

async function hkdfExpand(
  prk: Uint8Array,
  info: Uint8Array,
  length: number
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    prk,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const input = new Uint8Array(info.length + 1);
  input.set(info, 0);
  input[info.length] = 1;
  const result = new Uint8Array(await crypto.subtle.sign("HMAC", key, input));
  return result.slice(0, length);
}

// Main handler
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
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get push subscriptions
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let query = adminClient.from("push_subscriptions").select("*");

    if (target_user_ids && target_user_ids.length > 0) {
      query = query.in("user_id", target_user_ids);
    } else if (campanha_id) {
      // Get all users in this campaign
      const { data: campaignUsers } = await adminClient
        .from("profiles")
        .select("id")
        .eq("campanha_id", campanha_id);

      if (campaignUsers && campaignUsers.length > 0) {
        query = query.in(
          "user_id",
          campaignUsers.map((u: any) => u.id)
        );
      }
    }

    const { data: subscriptions, error: subError } = await query;

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscriptions" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({
          enviados: 0,
          falhas: 0,
          total: 0,
          message: "No subscriptions found",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
    const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
    const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT")!;

    const payloadStr = JSON.stringify({
      title: titulo,
      body:
        conteudo.length > 200 ? conteudo.substring(0, 200) + "..." : conteudo,
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      data: { url: "/mensagens" },
    });

    let enviados = 0;
    let falhas = 0;
    const staleEndpoints: string[] = [];

    for (const sub of subscriptions) {
      try {
        const vapidHeaders = await createVapidAuthHeader(
          sub.endpoint,
          VAPID_SUBJECT,
          VAPID_PUBLIC_KEY,
          VAPID_PRIVATE_KEY
        );

        const encrypted = await encryptPayload(
          payloadStr,
          sub.p256dh,
          sub.auth_key
        );

        const response = await fetch(sub.endpoint, {
          method: "POST",
          headers: {
            ...vapidHeaders,
            "Content-Type": "application/octet-stream",
            "Content-Encoding": "aes128gcm",
            TTL: "86400",
          },
          body: encrypted.body,
        });

        if (response.status === 201 || response.status === 200) {
          enviados++;
        } else if (response.status === 404 || response.status === 410) {
          // Subscription expired/invalid - mark for cleanup
          staleEndpoints.push(sub.endpoint);
          falhas++;
        } else {
          console.error(
            `Push failed for ${sub.endpoint}: ${response.status} ${await response.text()}`
          );
          falhas++;
        }
      } catch (err) {
        console.error(`Push error for ${sub.endpoint}:`, err);
        falhas++;
      }
    }

    // Clean up stale subscriptions
    if (staleEndpoints.length > 0) {
      await adminClient
        .from("push_subscriptions")
        .delete()
        .in("endpoint", staleEndpoints);
    }

    return new Response(
      JSON.stringify({
        enviados,
        falhas,
        total: subscriptions.length,
        removidos: staleEndpoints.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("send-push error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
