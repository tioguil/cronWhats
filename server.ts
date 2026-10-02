import next from "next";
import { createServer } from "node:http";
import { startScheduler } from "./lib/scheduler";
import { initializeWhatsApp } from "./lib/whatsapp";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = Number(process.env.PORT || 3000);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

async function main() {
  const required = ["APP_USERNAME", "APP_PASSWORD", "AUTH_SECRET"] as const;
  const missing = required.filter((name) => !process.env[name]);
  if (!dev && missing.length) {
    throw new Error(`Variáveis obrigatórias ausentes: ${missing.join(", ")}`);
  }
  await app.prepare();

  createServer((req, res) => handle(req, res)).listen(port, hostname, () => {
    console.log(`CronWhats disponível em http://${hostname}:${port}`);
  });

  initializeWhatsApp();
  startScheduler();
}

main().catch((error) => {
  console.error("Falha ao iniciar o servidor", error);
  process.exit(1);
});
