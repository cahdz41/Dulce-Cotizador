const SESSION_SECRET = process.env.SESSION_SECRET!;

export async function signToken(username: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = btoa(`${username}:${Date.now()}`);
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  const sigBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return `${data}.${sigBase64}`;
}

export async function verifyToken(token: string): Promise<boolean> {
  const [data, sigBase64] = token.split(".");
  if (!data || !sigBase64) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const signature = Uint8Array.from(atob(sigBase64), (c) => c.charCodeAt(0));
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    signature,
    encoder.encode(data)
  );

  return valid;
}
