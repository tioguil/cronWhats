import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "cronwhats_session";

function secret() {
  return process.env.AUTH_SECRET || "development-only-secret-change-me";
}

export function createSessionToken(username: string) {
  const payload = Buffer.from(JSON.stringify({ username, exp: Date.now() + 7 * 86400_000 })).toString("base64url");
  const signature = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function validateSessionToken(token?: string) {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return false;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as { exp: number };
    return session.exp > Date.now();
  } catch {
    return false;
  }
}

export function safePasswordMatch(received: string, expected: string) {
  const left = Buffer.from(received);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}
