// Web Push sender — edge-compatible (Web Crypto only).
// Sends VAPID-authenticated empty pushes. The service worker shows a default message.

function b64urlToBytes(s: string): Uint8Array {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function bytesToB64url(b: Uint8Array): string {
  let s = "";
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function strToB64url(s: string): string {
  return bytesToB64url(new TextEncoder().encode(s));
}

async function importVapidPrivate(privB64url: string): Promise<CryptoKey> {
  const d = privB64url;
  // Build a JWK; we need x,y too — derive from public key
  const pub = b64urlToBytes(process.env.VAPID_PUBLIC_KEY!);
  if (pub.length !== 65 || pub[0] !== 0x04) throw new Error("Invalid VAPID public key");
  const x = bytesToB64url(pub.slice(1, 33));
  const y = bytesToB64url(pub.slice(33, 65));
  const jwk: JsonWebKey = { kty: "EC", crv: "P-256", d, x, y, ext: true };
  return crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
}

async function signVapidJwt(audience: string): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: process.env.VAPID_SUBJECT || "mailto:contact@afrique-business.com",
  };
  const data = `${strToB64url(JSON.stringify(header))}.${strToB64url(JSON.stringify(payload))}`;
  const key = await importVapidPrivate(process.env.VAPID_PRIVATE_KEY!);
  const sigBuf = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(data));
  const sig = bytesToB64url(new Uint8Array(sigBuf));
  return `${data}.${sig}`;
}

export interface PushSubLite {
  endpoint: string;
}

export async function sendEmptyPush(sub: PushSubLite, ttl = 12 * 3600): Promise<{ ok: boolean; status: number; gone: boolean }> {
  const url = new URL(sub.endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const jwt = await signVapidJwt(audience);
  const res = await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      TTL: String(ttl),
      Urgency: "normal",
      Authorization: `vapid t=${jwt}, k=${process.env.VAPID_PUBLIC_KEY!}`,
      "Content-Length": "0",
    },
  });
  return { ok: res.ok, status: res.status, gone: res.status === 404 || res.status === 410 };
}
