"use client";

import { CalendarDays, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Brand } from "@/components/layout/brand";
import { Button, Field, InlineError } from "@/components/ui/primitives";
import { apiMessage, requestBookinfy } from "@/lib/bookinfy/api-client";

export function OwnerLogin() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function enter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setError("");
    setBusy(true);
    try {
      await requestBookinfy("session", {
        method: "POST",
        body: JSON.stringify({
          email: fields.get("email"),
          password: fields.get("password"),
        }),
      });
      router.replace("/app/agenda");
    } catch (err) {
      setError(apiMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <aside className="auth-story">
        <Brand light />
        <div className="auth-story-copy">
          <h2>Organize sua agenda.</h2>
          <p>Consulte os horários reservados no seu estabelecimento.</p>
        </div>
        <CalendarDays size={40} aria-hidden="true" />
      </aside>
      <div className="auth-main">
        <div className="auth-top">
          <div className="auth-mobile-brand">
            <Brand />
          </div>
          <Link href="/" className="subtle-link">
            Voltar ao site
          </Link>
        </div>
        <main id="main" className="auth-form-wrap">
          <div className="auth-form-header">
            <span className="auth-form-icon">
              <LockKeyhole size={24} />
            </span>
            <h1>Entrar no painel</h1>
            <p>Acesse com a conta vinculada ao seu estabelecimento.</p>
          </div>
          <form onSubmit={enter} className="auth-form">
            <Field
              name="email"
              label="E-mail"
              type="email"
              autoComplete="username"
              maxLength={254}
              required
            />
            <Field
              name="password"
              label="Senha"
              type="password"
              autoComplete="current-password"
              maxLength={256}
              required
            />
            <InlineError>{error}</InlineError>
            <Button type="submit" className="full-width" busy={busy}>
              Entrar
            </Button>
          </form>
        </main>
      </div>
    </div>
  );
}
