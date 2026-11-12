"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { Brand, Credit } from "@/components/layout/brand";
import {
  Badge,
  Button,
  ButtonLink,
  Field,
  InlineError,
} from "@/components/ui/primitives";
import { ProductPreview } from "@/features/marketing/sections";
import { useDemo } from "@/lib/data/use-demo";
import { repository } from "@/lib/data/mock-repository";
import type { Role } from "@/types/domain";

export function AuthScreen({
  mode,
}: {
  mode: "login" | "register" | "recover";
}) {
  const data = useDemo();
  const router = useRouter();
  const [role, setRole] = useState<Role>("owner");
  const [professionalId, setProfessionalId] = useState("leo");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [recovered, setRecovered] = useState(false);
  const register = mode === "register";
  const recover = mode === "recover";

  async function enter(ownerName = "Alex Costa", company = "") {
    setBusy(true);
    setError("");
    try {
      const professional = data?.professionals.find(
        (item) => item.id === professionalId,
      );
      await repository.signIn({
        role: register ? "owner" : role,
        name:
          !register && role === "staff"
            ? (professional?.name ?? "Leonardo Silva")
            : ownerName,
        professionalId: !register && role === "staff" ? professionalId : "",
        tenantId:
          !register && role === "staff"
            ? (professional?.tenantId ?? "studio")
            : "studio",
      });
      if (register && company && data)
        await repository.saveTenant({ ...data.tenants[0], name: company });
      router.push(
        !register && role === "staff" ? "/app/agenda" : "/app/dashboard",
      );
    } catch {
      setError("Não foi possível abrir a demonstração. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    if (recover) {
      setRecovered(true);
      return;
    }
    void enter(
      String(fields.get("name") ?? "Alex Costa"),
      String(fields.get("company") ?? ""),
    );
  }

  return (
    <div className="auth-page">
      <aside className="auth-story">
        <Brand light />
        <div className="auth-story-copy">
          <span className="auth-eyebrow">
            <span className="small-dot" /> SUA PRÓXIMA FASE COMEÇA AQUI.
          </span>
          <h2>
            {register ? (
              <>
                Quem cuida de gente
                <br />
                também merece
                <br />
                <em>uma rotina leve.</em>
              </>
            ) : (
              <>
                O próximo nível
                <br />
                da sua gestão
                <br />
                <em>tá aqui.</em>
              </>
            )}
          </h2>
          <p>
            Mais organização na agenda.
            <br />
            Mais tempo para o seu negócio.
          </p>
        </div>
        <div className="auth-product">
          <ProductPreview compact />
        </div>
        <div className="auth-story-bottom">
          <span className="auth-story-check">
            <Check size={23} strokeWidth={3} />
          </span>
          <p>
            Um lugar para organizar.
            <br />
            <strong>Mais espaço para crescer.</strong>
          </p>
          <CalendarDays size={26} />
        </div>
      </aside>
      <div className="auth-main">
        <div className="auth-top">
          <div className="auth-mobile-brand">
            <Brand />
          </div>
          <Link href="/" className="subtle-link">
            <ArrowLeft size={15} /> Voltar ao site
          </Link>
          <Badge>Demonstração</Badge>
        </div>
        <main id="main" className="auth-form-wrap">
          <div className="auth-form-header">
            <span className="auth-form-icon">
              {recover ? (
                <LockKeyhole size={24} />
              ) : (
                <Check size={26} strokeWidth={3} />
              )}
            </span>
            <p className="eyebrow">BOOKINFY · SEU NEGÓCIO EM SINTONIA</p>
            <h1>
              {recover
                ? "Um novo começo."
                : register
                  ? "Dê espaço ao próximo passo."
                  : "Bom ter você por aqui."}
            </h1>
            <p>
              {recover
                ? "Conheça a experiência de recuperação de acesso."
                : register
                  ? "Crie seu espaço demonstrativo e conheça a gestão."
                  : "Acesse a demonstração e conheça sua nova rotina."}
            </p>
          </div>
          {recovered ? (
            <div className="recovery-success">
              <Mail size={32} />
              <h2>Fluxo de recuperação visualizado.</h2>
              <p>
                Em uma conta real, você receberia um link para redefinir sua
                senha. Nenhum e-mail foi enviado nesta demonstração.
              </p>
              <ButtonLink href="/login" variant="secondary">
                Voltar para entrar
              </ButtonLink>
            </div>
          ) : (
            <form onSubmit={submit} className="auth-form">
              {!recover && !register ? (
                <>
                  <div className="role-tabs" aria-label="Perfil de acesso">
                    <button
                      type="button"
                      onClick={() => setRole("owner")}
                      aria-pressed={role === "owner"}
                      className={role === "owner" ? "selected" : ""}
                    >
                      Sou dono(a)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("staff")}
                      aria-pressed={role === "staff"}
                      className={role === "staff" ? "selected" : ""}
                    >
                      Sou da equipe
                    </button>
                  </div>
                  {role === "staff" ? (
                    <div className="field">
                      <label htmlFor="demo-professional">
                        Profissional da demonstração
                      </label>
                      <select
                        id="demo-professional"
                        value={professionalId}
                        onChange={(event) =>
                          setProfessionalId(event.target.value)
                        }
                      >
                        {(
                          data?.professionals ?? [
                            { id: "leo", name: "Leonardo Silva", active: true },
                          ]
                        )
                          .filter((item) => item.active)
                          .map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  ) : null}
                </>
              ) : null}
              {register ? (
                <>
                  <Field
                    label="Seu nome"
                    name="name"
                    placeholder="Como podemos te chamar?"
                    autoComplete="name"
                    required
                    minLength={3}
                    maxLength={100}
                  />
                  <Field
                    label="Nome do seu negócio"
                    name="company"
                    placeholder="Um nome para seu espaço"
                    autoComplete="organization"
                    required
                    minLength={2}
                    maxLength={100}
                  />
                  <Field
                    label="Telefone"
                    name="phone"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    autoComplete="tel"
                    required
                    pattern="[\d\s()+-]{10,17}"
                    maxLength={17}
                  />
                </>
              ) : null}
              <Field
                label="E-mail"
                name="email"
                type="email"
                placeholder="voce@example.com"
                autoComplete="email"
                required
                maxLength={150}
              />
              {!recover && !register ? (
                <div className="field password-field">
                  <label htmlFor="password">Senha demonstrativa</label>
                  <div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Digite ao menos 6 caracteres"
                      autoComplete="off"
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword ? "Ocultar senha" : "Mostrar senha"
                      }
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <small>
                    Use qualquer senha fictícia. Ela não será salva.
                  </small>
                </div>
              ) : null}
              {mode === "login" ? (
                <Link href="/recuperar-senha" className="forgot-link">
                  Esqueci minha senha
                </Link>
              ) : null}
              {register ? (
                <label className="checkbox-label">
                  <input type="checkbox" required /> Entendo que este acesso é
                  demonstrativo, sem criação de conta real, e usarei dados
                  fictícios.
                </label>
              ) : null}
              <InlineError>{error}</InlineError>
              <Button type="submit" busy={busy} className="full-width">
                {recover
                  ? "Simular recuperação"
                  : register
                    ? "Criar espaço demonstrativo"
                    : "Entrar na demonstração"}
                <ArrowRight size={17} />
              </Button>
              <p className="auth-demo-note">
                <ShieldCheck size={14} />{" "}
                {register
                  ? "Cadastro local de demonstração. Sem contratação."
                  : recover
                    ? "Nenhum e-mail será enviado."
                    : "Acesso visual. Nenhuma autenticação real nesta etapa."}
              </p>
            </form>
          )}
          {mode === "login" ? (
            <>
              <div className="or-divider">
                <span>ou explore diretamente</span>
              </div>
              <Button
                onClick={() => void enter()}
                variant="secondary"
                className="full-width"
                busy={busy}
              >
                {role === "owner"
                  ? "Explorar como dono(a)"
                  : "Explorar como funcionário(a)"}
                <ArrowUpRightIcon />
              </Button>
            </>
          ) : null}
          <p className="auth-switch">
            {register ? "Já conhece o seu próximo passo?" : "Chegando agora?"}{" "}
            <Link href={register || recover ? "/login" : "/cadastro"}>
              {register || recover ? "Faça login" : "Conheça o Bookinfy"}
            </Link>
          </p>
        </main>
        <div className="auth-credit">
          <Credit />
        </div>
      </div>
    </div>
  );
}

function ArrowUpRightIcon() {
  return <ArrowRight size={17} className="arrow-up-right" />;
}
