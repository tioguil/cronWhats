import { NextRequest, NextResponse } from "next/server";

const COOKIE = "cronwhats_session";

async function validToken(token?: string) {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const secret = process.env.AUTH_SECRET || "development-only-secret-change-me";
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const expected = Buffer.from(signed).toString("base64url");
  if (expected !== signature) return false;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as { exp: number };
    return session.exp > Date.now();
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/login" || pathname.startsWith("/api/auth/")) return NextResponse.next();
  const authenticated = await validToken(request.cookies.get(COOKIE)?.value);
  if (authenticated) return NextResponse.next();
  if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
