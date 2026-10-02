import LoginForm from "../ui/login-form";

export default function LoginPage() {
  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="brand-mark">C</div>
        <p className="eyebrow">AUTOMAÇÃO PESSOAL</p>
        <h1>Bem-vindo ao CronWhats</h1>
        <p className="muted">Entre para gerenciar suas mensagens agendadas.</p>
        <LoginForm />
      </section>
    </main>
  );
}
