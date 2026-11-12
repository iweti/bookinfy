"use client";

import {
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  MessageCircle,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import {
  Badge,
  Button,
  Field,
  InlineError,
  Modal,
  PageHeading,
  PageSkeleton,
  useToast,
} from "@/components/ui/primitives";
import { useDemo } from "@/lib/data/use-demo";
import { repository } from "@/lib/data/mock-repository";
import { minutes } from "@/lib/scheduling";
import type { Tenant } from "@/types/domain";

export function Settings() {
  const data = useDemo();
  const [tab, setTab] = useState("business");
  const [resetOpen, setResetOpen] = useState(false);
  const toast = useToast();
  if (!data?.session) return <PageSkeleton />;
  const tenant = data.tenants.find(
    (item) => item.id === data.session?.tenantId,
  )!;
  async function reset() {
    await repository.reset();
    setResetOpen(false);
    toast("Demonstração restaurada. Um novo começo para explorar.");
  }
  return (
    <>
      <PageHeading
        eyebrow="TUDO DO SEU JEITO"
        title="O seu espaço, em cada detalhe."
        description="Ajuste as informações e conheça os próximos passos do produto."
      />
      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Seções de configurações">
          {[
            { id: "business", title: "Seu negócio", icon: Building2 },
            { id: "schedule", title: "Rotina da agenda", icon: CalendarDays },
            { id: "integrations", title: "Integrações", icon: MessageCircle },
            { id: "demo", title: "Demonstração", icon: ShieldCheck },
          ].map(({ id, title, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={tab === id ? "active" : ""}
              aria-pressed={tab === id}
            >
              <Icon size={18} />
              {title}
              <ChevronRight size={15} />
            </button>
          ))}
        </nav>
        <section className="panel settings-panel">
          {tab === "business" ? (
            <>
              <div className="panel-heading">
                <div>
                  <h2>O cuidado começa na apresentação.</h2>
                  <p>Informações da unidade selecionada.</p>
                </div>
                <Building2 size={20} />
              </div>
              <BusinessForm key={tenant.id} tenant={tenant} />
            </>
          ) : tab === "schedule" ? (
            <>
              <div className="panel-heading">
                <div>
                  <h2>Um ritmo que funciona para você.</h2>
                  <p>
                    Horários demonstrativos compartilhados pela equipe desta
                    unidade.
                  </p>
                </div>
                <CalendarDays size={20} />
              </div>
              <ScheduleForm key={tenant.id} tenant={tenant} />
            </>
          ) : tab === "integrations" ? (
            <>
              <div className="panel-heading">
                <div>
                  <h2>O próximo capítulo da sua gestão.</h2>
                  <p>Integrações previstas para a evolução do produto.</p>
                </div>
                <Sparkles size={21} />
              </div>
              <div className="integration-list">
                {[
                  {
                    title: "WhatsApp",
                    description:
                      "Confirmações, lembretes e ofertas de horários.",
                    phase: "Etapa 3",
                  },
                  {
                    title: "API em Go",
                    description:
                      "Dados reais, autenticação e permissões por estabelecimento.",
                    phase: "Etapa 2",
                  },
                  {
                    title: "Recuperação de horários",
                    description: "Vagas livres conectadas à lista de espera.",
                    phase: "Etapa 3",
                  },
                ].map((item) => (
                  <div key={item.title}>
                    <span className="integration-icon">
                      <MessageCircle size={22} />
                    </span>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </div>
                    <Badge tone="neutral">{item.phase}</Badge>
                  </div>
                ))}
              </div>
              <p className="settings-note">
                <ShieldCheck size={16} /> Nenhuma integração externa está
                conectada nesta demonstração.
              </p>
            </>
          ) : (
            <>
              <div className="panel-heading">
                <div>
                  <h2>Espaço para explorar à vontade.</h2>
                  <p>
                    Um ambiente fictício para conhecer as jornadas do Bookinfy.
                  </p>
                </div>
                <ShieldCheck size={21} />
              </div>
              <div className="demo-settings">
                <div>
                  <strong>Etapa 1 · Front-end visual</strong>
                  <p>
                    As alterações ficam neste navegador. Não há conta real,
                    pagamento, envio de WhatsApp ou e-mail.
                  </p>
                </div>
                <div>
                  <strong>Perfis demonstrativos</strong>
                  <p>
                    Dono: visão de gestão. Funcionário: agenda individual. As
                    permissões reais serão implementadas na API da Etapa 2.
                  </p>
                </div>
                <div className="reset-section">
                  <strong>Começar uma nova exploração</strong>
                  <p>
                    Restaure os cadastros, atendimentos, despesas e
                    configurações iniciais. As alterações locais serão
                    substituídas.
                  </p>
                  <Button
                    variant="secondary"
                    onClick={() => setResetOpen(true)}
                  >
                    <RotateCcw size={17} /> Restaurar demonstração
                  </Button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
      {resetOpen ? (
        <Modal
          title="Um novo começo?"
          description="Esta ação substitui todos os dados demonstrativos deste navegador pelos exemplos iniciais."
          onClose={() => setResetOpen(false)}
        >
          <div className="form-actions">
            <Button variant="ghost" onClick={() => setResetOpen(false)}>
              Continuar explorando
            </Button>
            <Button variant="danger" onClick={() => void reset()}>
              Restaurar dados de exemplo
            </Button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}

function BusinessForm({ tenant }: { tenant: Tenant }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      await repository.saveTenant({
        ...tenant,
        name: String(fields.get("name")).trim(),
        segment: String(fields.get("segment")),
        phone: String(fields.get("phone")),
        address: String(fields.get("address")),
        city: String(fields.get("city")),
      });
      toast("Seu espaço está atualizado.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="management-form settings-form" onSubmit={submit}>
      <Field
        label="Nome do negócio"
        name="name"
        defaultValue={tenant.name}
        required
        minLength={2}
        maxLength={100}
      />
      <div className="form-two">
        <Field
          label="Segmento"
          name="segment"
          defaultValue={tenant.segment}
          required
          maxLength={100}
        />
        <Field
          label="Telefone"
          name="phone"
          type="tel"
          defaultValue={tenant.phone}
          required
          pattern="[\d\s()+-]{10,17}"
          maxLength={17}
        />
      </div>
      <Field
        label="Endereço"
        name="address"
        defaultValue={tenant.address}
        required
        maxLength={200}
      />
      <Field
        label="Cidade e estado"
        name="city"
        defaultValue={tenant.city}
        required
        maxLength={100}
      />
      <InlineError>{error}</InlineError>
      <div className="form-actions">
        <Button type="submit" busy={busy}>
          <Check size={17} /> Salvar alterações
        </Button>
      </div>
    </form>
  );
}

function ScheduleForm({ tenant }: { tenant: Tenant }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const weekdays = fields.getAll("weekdays").map(Number);
    const open = String(fields.get("open"));
    const close = String(fields.get("close"));
    if (!weekdays.length) {
      setError("Escolha pelo menos um dia de funcionamento.");
      return;
    }
    if (minutes(open) >= minutes(close)) {
      setError("O encerramento precisa ser depois da abertura.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await repository.saveTenant({ ...tenant, weekdays, open, close });
      toast(
        "Rotina atualizada para novos agendamentos. Os existentes foram preservados.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="management-form settings-form" onSubmit={submit}>
      <fieldset className="weekday-options">
        <legend>Dias para receber bem</legend>
        {[
          "Domingo",
          "Segunda",
          "Terça",
          "Quarta",
          "Quinta",
          "Sexta",
          "Sábado",
        ].map((day, i) => (
          <label key={day}>
            <input
              type="checkbox"
              name="weekdays"
              value={i}
              defaultChecked={tenant.weekdays.includes(i)}
            />
            <span>{day.slice(0, 3)}</span>
          </label>
        ))}
      </fieldset>
      <div className="form-two">
        <Field
          label="Abertura"
          name="open"
          type="time"
          defaultValue={tenant.open}
          step={1800}
          required
        />
        <Field
          label="Encerramento"
          name="close"
          type="time"
          defaultValue={tenant.close}
          step={1800}
          required
        />
      </div>
      <p className="settings-note">
        <ClockNote /> Horário de São Paulo. Novos horários são oferecidos a cada
        30 minutos; a duração do serviço bloqueia todo o intervalo necessário.
      </p>
      <p className="settings-note">
        Esta configuração é demonstrativa. Jornadas individuais, pausas e
        políticas reais de agendamento serão definidas na integração com a API.
      </p>
      <InlineError>{error}</InlineError>
      <div className="form-actions">
        <Button type="submit" busy={busy}>
          <Check size={17} /> Salvar rotina
        </Button>
      </div>
    </form>
  );
}

function ClockNote() {
  return <CalendarDays size={17} />;
}
