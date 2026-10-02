import { NextResponse } from "next/server";
import db, { type Schedule } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const schedules = db.prepare("SELECT * FROM schedules ORDER BY created_at DESC, id DESC").all() as Schedule[];
  return NextResponse.json(schedules);
}

export async function POST(request: Request) {
  const body = await request.json();
  const name = String(body.name || "").trim();
  const phone = String(body.phone || "").replace(/\D/g, "");
  const time = String(body.time || "");
  const timezone = String(body.timezone || "");
  const context = String(body.context || "").trim();
  if (!name || phone.length < 10 || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) || !timezone || !context) {
    return NextResponse.json({ error: "Preencha todos os campos corretamente." }, { status: 400 });
  }
  try { new Intl.DateTimeFormat("pt-BR", { timeZone: timezone }).format(); } catch { return NextResponse.json({ error: "Fuso horário inválido." }, { status: 400 }); }
  const result = db.prepare("INSERT INTO schedules (name, phone, time, timezone, context) VALUES (?, ?, ?, ?, ?)").run(name, phone, time, timezone, context);
  return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
}
