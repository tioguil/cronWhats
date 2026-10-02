import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { getWhatsAppStatus } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = getWhatsAppStatus();
  const qrDataUrl = status.qrCode ? await QRCode.toDataURL(status.qrCode, { width: 240, margin: 2 }) : null;
  return NextResponse.json({ state: status.state, detail: status.detail, qrDataUrl });
}
