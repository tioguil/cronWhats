import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  if (typeof body.enabled !== "boolean") return NextResponse.json({ error: "Alteração inválida" }, { status: 400 });
  const result = db.prepare("UPDATE schedules SET enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(body.enabled ? 1 : 0, id);
  return result.changes ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = db.prepare("DELETE FROM schedules WHERE id = ?").run(id);
  return result.changes ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
}
