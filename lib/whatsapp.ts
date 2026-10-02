import { Client, LocalAuth } from "whatsapp-web.js";

type State = "starting" | "qr" | "authenticated" | "ready" | "disconnected" | "error";

let client: Client | null = null;
let initializing = false;
let state: State = "starting";
let qrCode: string | null = null;
let detail = "Iniciando WhatsApp...";

export function initializeWhatsApp() {
  if (client || initializing) return;
  initializing = true;

  client = new Client({
    authStrategy: new LocalAuth({ dataPath: ".wwebjs_auth" }),
    puppeteer: {
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
    }
  });

  client.on("qr", (qr) => {
    state = "qr";
    qrCode = qr;
    detail = "Leia o QR Code no WhatsApp para conectar.";
  });
  client.on("authenticated", () => {
    state = "authenticated";
    qrCode = null;
    detail = "Sessão autenticada. Carregando conversas...";
  });
  client.on("ready", () => {
    state = "ready";
    qrCode = null;
    detail = "WhatsApp conectado e pronto para enviar.";
  });
  client.on("disconnected", (reason) => {
    state = "disconnected";
    detail = `WhatsApp desconectado: ${reason}`;
  });
  client.on("auth_failure", (message) => {
    state = "error";
    detail = `Falha de autenticação: ${message}`;
  });

  client.initialize().catch((error) => {
    state = "error";
    detail = error instanceof Error ? error.message : "Erro ao iniciar WhatsApp";
    console.error(error);
  }).finally(() => {
    initializing = false;
  });
}

export function getWhatsAppStatus() {
  return { state, qrCode, detail };
}

export async function sendWhatsAppMessage(phone: string, message: string) {
  if (!client || state !== "ready") throw new Error("WhatsApp ainda não está conectado");
  const digits = phone.replace(/\D/g, "");
  const numberId = await client.getNumberId(digits);
  if (!numberId) throw new Error("O número informado não possui WhatsApp");
  await client.sendMessage(numberId._serialized, message);
}
