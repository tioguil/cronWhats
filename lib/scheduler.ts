import OpenAI from "openai";
import db, { type Schedule } from "./db";
import { sendWhatsAppMessage } from "./whatsapp";

let timer: NodeJS.Timeout | null = null;
let running = false;

function localRunKey(now: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
  const date = `${value("year")}-${value("month")}-${value("day")}`;
  const time = `${value("hour")}:${value("minute")}`;
  return { key: `${date} ${time}`, time };
}

async function createMessage(schedule: Schedule) {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY não configurada");
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5-mini",
    instructions: "Você escreve mensagens pessoais para WhatsApp em português do Brasil. Entregue apenas a mensagem final, sem aspas, título, comentários ou formatação Markdown. Varie naturalmente o texto a cada dia e nunca invente fatos específicos que não estejam no contexto.",
    input: `Crie a mensagem de hoje usando este contexto:\n\n${schedule.context}`
  });
  const message = response.output_text.trim();
  if (!message) throw new Error("A OpenAI retornou uma mensagem vazia");
  return message;
}

async function execute(schedule: Schedule) {
  try {
    const message = await createMessage(schedule);
    await sendWhatsAppMessage(schedule.phone, message);
    db.prepare(`UPDATE schedules SET last_status = 'sent', last_message = ?, last_error = NULL, last_run_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(message, new Date().toISOString(), schedule.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    db.prepare(`UPDATE schedules SET last_status = 'error', last_error = ?, last_run_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(message, new Date().toISOString(), schedule.id);
    console.error(`Falha no agendamento ${schedule.id}:`, error);
  }
}

async function tick() {
  if (running) return;
  running = true;
  try {
    const schedules = db.prepare("SELECT * FROM schedules WHERE enabled = 1").all() as Schedule[];
    const now = new Date();
    for (const schedule of schedules) {
      let local;
      try {
        local = localRunKey(now, schedule.timezone);
      } catch {
        console.error(`Fuso inválido no agendamento ${schedule.id}: ${schedule.timezone}`);
        continue;
      }
      if (local.time !== schedule.time || schedule.last_run_key === local.key) continue;

      const claimed = db.prepare("UPDATE schedules SET last_run_key = ? WHERE id = ? AND (last_run_key IS NULL OR last_run_key <> ?)")
        .run(local.key, schedule.id, local.key);
      if (claimed.changes === 1) await execute(schedule);
    }
  } finally {
    running = false;
  }
}

export function startScheduler() {
  if (timer) return;
  const interval = Math.max(5_000, Number(process.env.SCHEDULER_INTERVAL_MS || 15_000));
  void tick();
  timer = setInterval(() => void tick(), interval);
  console.log(`Agendador iniciado (intervalo ${interval}ms)`);
}
