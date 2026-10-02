"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Schedule = {
  id: number; name: string; phone: string; time: string; timezone: string; context: string;
  enabled: number; last_status: string | null; last_message: string | null; last_error: string | null; last_run_at: string | null;
};
type WhatsAppStatus = { state: string; detail: string; qrDataUrl: string | null };

const empty = { name: "", phone: "", time: "08:00", timezone: "America/Sao_Paulo", context: "" };

export default function Dashboard() {
  const [items, setItems] = useState<Schedule[]>([]);
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [scheduleResponse, statusResponse] = await Promise.all([fetch("/api/schedules"), fetch("/api/whatsapp/status")]);
    if (scheduleResponse.ok) setItems(await scheduleResponse.json());
    if (statusResponse.ok) setStatus(await statusResponse.json());
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 5000);
    return () => clearInterval(timer);
  }, [load]);

  async function create(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    const response = await fetch("/api/schedules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    if (!response.ok) return alert((await response.json()).error || "Não foi possível salvar");
    setForm(empty);
    setShowForm(false);
    await load();
  }

  async function action(id: number, method: "PATCH" | "DELETE", body?: object) {
    await fetch(`/api/schedules/${id}`, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    await load();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    location.href = "/login";
  }

  return (
    <main className="app-shell">
      <header>
        <div className="brand"><span className="brand-mark small">C</span><div><strong>CronWhats</strong><span>Mensagens no momento certo</span></div></div>
        <button className="ghost" onClick={logout}>Sair</button>
      </header>

      <section className="hero">
        <div><p className="eyebrow">SEU ASSISTENTE DE MENSAGENS</p><h1>Cuide dos seus contatos.<br/><em>Nós cuidamos do horário.</em></h1><p>Crie mensagens únicas com IA e envie automaticamente pelo WhatsApp.</p></div>
        <button className="primary add" onClick={() => setShowForm(!showForm)}>＋ Nova mensagem</button>
      </section>

      <section className={`connection ${status?.state === "ready" ? "connected" : ""}`}>
        <div className="status-icon">{status?.state === "ready" ? "✓" : "↗"}</div>
        <div><strong>{status?.state === "ready" ? "WhatsApp conectado" : "Conecte seu WhatsApp"}</strong><p>{status?.detail || "Preparando conexão..."}</p></div>
        {status?.qrDataUrl && <img className="qr" src={status.qrDataUrl} alt="QR Code para conectar o WhatsApp" />}
      </section>

      {showForm && <section className="card editor">
        <div className="section-title"><div><p className="eyebrow">NOVO AGENDAMENTO</p><h2>O que você quer enviar?</h2></div><button className="icon-button" onClick={() => setShowForm(false)}>×</button></div>
        <form onSubmit={create} className="schedule-form">
          <label>Nome do agendamento<input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} placeholder="Ex.: Bom dia para a mãe" required /></label>
          <label>WhatsApp com DDI<input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} placeholder="5511999999999" inputMode="tel" required /></label>
          <div className="form-row"><label>Horário<input type="time" value={form.time} onChange={(e) => setForm({...form, time: e.target.value})} required /></label><label>Fuso horário<input value={form.timezone} onChange={(e) => setForm({...form, timezone: e.target.value})} required /></label></div>
          <label>Contexto para a IA<textarea value={form.context} onChange={(e) => setForm({...form, context: e.target.value})} placeholder="Ex.: É uma mensagem carinhosa para minha mãe. Deseje um ótimo dia, pergunte como ela está e varie o texto..." rows={5} required /></label>
          <div className="form-actions"><button type="button" className="secondary" onClick={() => setShowForm(false)}>Cancelar</button><button className="primary" disabled={saving}>{saving ? "Salvando..." : "Agendar todos os dias"}</button></div>
        </form>
      </section>}

      <section className="list-section">
        <div className="section-title"><div><p className="eyebrow">ROTINA</p><h2>Mensagens agendadas</h2></div><span className="count">{items.length} {items.length === 1 ? "agendamento" : "agendamentos"}</span></div>
        {items.length === 0 ? <div className="empty card"><span>✦</span><h3>Nenhuma mensagem agendada</h3><p>Crie sua primeira rotina e deixe as mensagens seguirem sozinhas.</p></div> : <div className="schedule-grid">{items.map((item) => <article className={`card schedule ${!item.enabled ? "disabled" : ""}`} key={item.id}>
          <div className="schedule-top"><div className="avatar">{item.name.charAt(0).toUpperCase()}</div><div className="grow"><h3>{item.name}</h3><p>+{item.phone.replace(/\D/g, "")}</p></div><button className={`toggle ${item.enabled ? "on" : ""}`} aria-label="Ativar ou pausar" onClick={() => action(item.id, "PATCH", { enabled: !item.enabled })}><span /></button></div>
          <div className="time-row"><strong>{item.time}</strong><span>todos os dias</span><span>·</span><small>{item.timezone}</small></div>
          <p className="context">{item.context}</p>
          {item.last_status && <div className={`last-status ${item.last_status}`}><strong>{item.last_status === "sent" ? "Enviada" : "Falhou"}</strong><span>{item.last_status === "sent" ? item.last_message : item.last_error}</span></div>}
          <div className="card-actions"><button className="danger-link" onClick={() => confirm("Excluir este agendamento?") && action(item.id, "DELETE")}>Excluir</button></div>
        </article>)}</div>}
      </section>

      <footer>Feito para rodar com calma, todos os dias.</footer>
    </main>
  );
}
