"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: form.get("username"), password: form.get("password") })
    });
    setLoading(false);
    if (!response.ok) return setError("Usuário ou senha inválidos.");
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="stack form-space">
      <label>Usuário<input name="username" autoComplete="username" required /></label>
      <label>Senha<input name="password" type="password" autoComplete="current-password" required /></label>
      {error && <p className="error-text">{error}</p>}
      <button className="primary" disabled={loading}>{loading ? "Entrando..." : "Entrar"}</button>
    </form>
  );
}
