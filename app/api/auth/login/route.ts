import { NextResponse } from "next/server";
import { createSessionToken, safePasswordMatch, SESSION_COOKIE } from "@/lib/auth";

export async function POST(request: Request) {
  const { username, password } = await request.json();
  const expectedUser = process.env.APP_USERNAME || (process.env.NODE_ENV === "development" ? "admin" : "");
  const expectedPassword = process.env.APP_PASSWORD || (process.env.NODE_ENV === "development" ? "admin" : "");
  if (!expectedUser || !expectedPassword || !process.env.AUTH_SECRET) {
    return NextResponse.json({ error: "Autenticação não configurada no servidor" }, { status: 503 });
  }
  if (username !== expectedUser || typeof password !== "string" || !safePasswordMatch(password, expectedPassword)) {
    return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, createSessionToken(expectedUser), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 7 * 86400, path: "/"
  });
  return response;
}
