"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronRight,
  Clock3,
  Download,
  MapPin,
  Scissors,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import { Suspense, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Brand, Credit } from "@/components/layout/brand";
import {
  Avatar,
  Badge,
  Button,
  ButtonLink,
  EmptyState,
  Field,
  InlineError,
  PageSkeleton,
} from "@/components/ui/primitives";
import { DatePicker } from "@/components/ui/date-picker";
import { useDemo } from "@/lib/data/use-demo";
import { repository } from "@/lib/data/mock-repository";
import { currency, dateLabel, isISODate } from "@/lib/format";
import { availableSlots } from "@/lib/scheduling";
import {
  apiMessage,
  businessPath,
  useBookinfyRequest,
} from "@/lib/bookinfy/api-client";
import { liveMode } from "@/lib/bookinfy/mode";
import type { Appointment, BookingDraft } from "@/types/domain";
import {
  createLiveBooking,
  useLiveCatalog,
  useLiveConfirmation,
} from "./booking-source";
import type {
  BookingCatalog,
  BookingConfirmation,
  SubmitBooking,
} from "./booking-source";

export type BookingStep =
  | "unidade"
  | "servico"
  | "profissional"
  | "data-horario"
  | "cliente"
  | "confirmacao";
const steps: { id: BookingStep; label: string; path: string }[] = [
  { id: "unidade", label: "Unidade", path: "/agendar" },
  { id: "servico", label: "Serviço", path: "/agendar/servico" },
  { id: "profissional", label: "Profissional", path: "/agendar/profissional" },
  {
    id: "data-horario",
    label: "Data e horário",
    path: "/agendar/data-horario",
  },
  { id: "cliente", label: "Seus dados", path: "/agendar/cliente" },
  { id: "confirmacao", label: "Confirmação", path: "/agendar/confirmacao" },
];

function BookingFlow({
  step,
  data,
  lastBooking,
  submit,
  demoAppointments,
  catalogError,
  retryCatalog,
}: {
  step: BookingStep;
  data: BookingCatalog | null;
  lastBooking: BookingConfirmation | null;
  submit: SubmitBooking;
  demoAppointments?: Appointment[];
  catalogError?: string;
  retryCatalog?: () => void;
}) {
  const demo = !liveMode;
  const query = useSearchParams();
  const router = useRouter();
  const queryDate = isISODate(query.get("data")) ? query.get("data")! : "";
  const queryTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(query.get("horario") ?? "")
    ? query.get("horario")!
    : "";
  const [date, setDate] = useState(queryDate);
  const [time, setTime] = useState(queryTime);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("Todos");
  const tenant = data?.tenants.find((item) => item.id === query.get("unidade"));
  const service = data?.services.find(
    (item) =>
      item.id === query.get("servico") &&
      item.tenantId === tenant?.id &&
      item.active,
  );
  const professional = data?.professionals.find(
    (item) =>
      item.id === query.get("profissional") &&
      item.tenantId === tenant?.id &&
      item.serviceIds.includes(service?.id ?? "") &&
      item.active,
  );
  const index = steps.findIndex((item) => item.id === step);
  const lastRequest = useRef<{ draft: string; id: string } | null>(null);

  function go(
    path: string,
    values: Record<string, string>,
    reset: string[] = [],
  ) {
    const params = new URLSearchParams(query.toString());
    reset.forEach((key) => params.delete(key));
    Object.entries(values).forEach(([key, value]) => params.set(key, value));
    router.push(`${path}?${params.toString()}`);
  }

  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tenant || !service || !professional) return;
    const fields = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const draft: BookingDraft = {
        tenantId: tenant.id,
        serviceId: service.id,
        professionalId: professional.id,
        date: queryDate,
        time: queryTime,
        customer: {
          name: String(fields.get("name")),
          phone: String(fields.get("phone")),
          email: String(fields.get("email") ?? ""),
        },
      };
      const serialized = JSON.stringify(draft);
      if (!lastRequest.current || lastRequest.current.draft !== serialized) {
        lastRequest.current = {
          draft: serialized,
          id: demo ? "" : crypto.randomUUID(),
        };
      }
      const result = await submit(draft, lastRequest.current.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(
        result.id
          ? `/agendar/confirmacao?reserva=${result.id}`
          : "/agendar/confirmacao",
      );
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function downloadCalendar() {
    if (!lastBooking) return;
    const start = new Date(`${lastBooking.date}T${lastBooking.time}:00-03:00`);
    const end = new Date(start.getTime() + lastBooking.duration * 60000);
    const stamp = (value: Date) =>
      value
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d{3}/, "");
    const escape = (value: string) =>
      value
        .replace(/\\/g, "\\\\")
        .replace(/\r\n?|\n/g, "\\n")
        .replace(/,/g, "\\,")
        .replace(/;/g, "\\;");
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      demo
        ? "PRODID:-//Bookinfy//Demo//PT-BR"
        : "PRODID:-//Bookinfy//Agendamento//PT-BR",
      "BEGIN:VEVENT",
      `UID:${lastBooking.id}@bookinfy`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(end)}`,
      `SUMMARY:${escape(`${lastBooking.service} — ${lastBooking.business}${demo ? " (demonstração)" : ""}`)}`,
      ...(demo
        ? [
            `DESCRIPTION:${escape("Agendamento demonstrativo. Não representa uma reserva real.")}`,
          ]
        : []),
      `LOCATION:${escape(lastBooking.address)}`,
      "END:VEVENT",
      "END:VCALENDAR",
      "",
    ].join("\r\n");
    const url = URL.createObjectURL(
      new Blob([ics], { type: "text/calendar;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = demo
      ? "bookinfy-demonstracao.ics"
      : "bookinfy-reserva.ics";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const titles = {
    unidade: [
      "Um momento para você.",
      "Escolha onde quer ser atendido e deixe o resto com a gente.",
    ],
    servico: [
      "Qual vai ser o cuidado de hoje?",
      "Escolha o serviço que combina com o seu momento.",
    ],
    profissional: [
      "Boas mãos fazem a diferença.",
      "Escolha quem vai cuidar de você.",
    ],
    "data-horario": [
      "Encontre seu melhor momento.",
      "Escolha uma data e um dos horários disponíveis.",
    ],
    cliente: [
      "Falta pouco para reservar.",
      "Preencha seus dados e confira o resumo antes de confirmar.",
    ],
    confirmacao: [
      "Seu momento está reservado!",
      "Tudo organizado para o seu próximo cuidado.",
    ],
  };
  const incomplete =
    step !== "unidade" &&
    step !== "confirmacao" &&
    (!tenant ||
      (index >= 2 && !service) ||
      (index >= 3 && !professional) ||
      (index >= 4 && (!queryDate || !queryTime)));
  const selection =
    tenant && service && professional && date
      ? { tenant, service, professional }
      : null;
  const remoteSlots = useBookinfyRequest<string[]>(
    !demo && step === "data-horario" && selection
      ? `${businessPath(selection.tenant.id)}/slots?${new URLSearchParams({
          service: selection.service.id,
          professional: selection.professional.id,
          date,
        })}`
      : null,
  );
  const slots =
    demo && selection
      ? availableSlots(
          selection.tenant,
          selection.service,
          selection.professional.id,
          date,
          demoAppointments ?? [],
        )
      : (remoteSlots.data ?? []);

  return (
    <div className="booking-page">
      <header className="booking-header container">
        <Brand />
        <Link href="/" className="subtle-link">
          <ArrowLeft size={15} /> Voltar ao site
        </Link>
      </header>
      {demo ? (
        <div className="demo-ribbon">
          <span className="small-dot" /> Demonstração visual · use dados
          fictícios
        </div>
      ) : null}
      <main id="main" className="container booking-main">
        <nav className="booking-steps" aria-label="Etapas do agendamento">
          <ol>
            {steps.map((item, i) => (
              <li
                key={item.id}
                className={i === index ? "current" : i < index ? "done" : ""}
                aria-current={i === index ? "step" : undefined}
              >
                <span>{i < index ? <Check size={13} /> : i + 1}</span>
                <strong>{item.label}</strong>
                {i < steps.length - 1 ? <ChevronRight size={14} /> : null}
              </li>
            ))}
          </ol>
        </nav>
        {catalogError ? (
          <EmptyState
            title="Não foi possível carregar o agendamento"
            description={catalogError}
            action={<Button onClick={retryCatalog}>Tentar novamente</Button>}
          />
        ) : !data ? (
          <PageSkeleton />
        ) : step === "unidade" && !data.tenants.length ? (
          <EmptyState
            title="Nenhum estabelecimento disponível"
            description="Volte mais tarde para consultar novamente."
          />
        ) : incomplete ? (
          <EmptyState
            title="Vamos começar do início?"
            description="Escolha a unidade, o serviço e o profissional para continuar seu agendamento."
            action={<ButtonLink href="/agendar">Escolher unidade</ButtonLink>}
          />
        ) : step === "confirmacao" ? (
          lastBooking ? (
            <div className="confirmation-card">
              <span className="confirmation-icon">
                <CheckCheck size={38} />
              </span>
              <Badge tone="green">
                {demo
                  ? "AGENDAMENTO DEMONSTRATIVO CRIADO"
                  : "AGENDAMENTO CONFIRMADO"}
              </Badge>
              <h1>{titles.confirmacao[0]}</h1>
              <p>O próximo encontro com o seu cuidado já tem hora.</p>
              <div className="confirmation-summary">
                <h2>{lastBooking.business}</h2>
                <strong>{lastBooking.service}</strong>
                <div>
                  <span>
                    <CalendarDays size={18} />
                    {dateLabel(lastBooking.date, {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </span>
                  <span>
                    <Clock3 size={18} />
                    {lastBooking.time} · {lastBooking.duration} min
                  </span>
                  <span>
                    <User size={18} />
                    {lastBooking.professional}
                  </span>
                </div>
                <div className="summary-total">
                  <span>Valor do serviço</span>
                  <strong>{currency(lastBooking.price)}</strong>
                </div>
              </div>
              {demo ? (
                <p className="confirmation-disclaimer">
                  Esta é uma reserva de demonstração, sem atendimento real ou
                  envio de mensagens. Você pode vê-la no painel do dono.
                </p>
              ) : null}
              <div className="confirmation-actions">
                <Button onClick={downloadCalendar} variant="secondary">
                  <Download size={17} /> Adicionar ao calendário
                </Button>
                {demo ? (
                  <ButtonLink href="/login">
                    Ver no painel <ArrowRight size={17} />
                  </ButtonLink>
                ) : null}
              </div>
              <Link href="/agendar" className="text-link">
                Fazer outro agendamento
              </Link>
            </div>
          ) : (
            <EmptyState
              title="Sua confirmação aparece aqui."
              description="Conclua o fluxo para ver os detalhes do seu agendamento."
              action={
                <ButtonLink href="/agendar">Começar agendamento</ButtonLink>
              }
            />
          )
        ) : (
          <>
            <div className="booking-heading">
              <p className="eyebrow">
                SEU CUIDADO, NO SEU TEMPO · PASSO {index + 1} DE 5
              </p>
              <h1>{titles[step][0]}</h1>
              <p>{titles[step][1]}</p>
            </div>
            <div className="booking-grid">
              <section
                className="booking-selection"
                aria-label={titles[step][0]}
              >
                {step === "unidade" ? (
                  <div className="tenant-grid">
                    {data.tenants.map((item) => (
                      <button
                        type="button"
                        className="tenant-choice"
                        key={item.id}
                        onClick={() =>
                          go("/agendar/servico", { unidade: item.id }, [
                            "servico",
                            "profissional",
                            "data",
                            "horario",
                          ])
                        }
                      >
                        <div className={`tenant-art tenant-art-${item.id}`}>
                          <Scissors size={43} strokeWidth={1.3} />
                          <span>UM ESPAÇO PARA CUIDAR.</span>
                        </div>
                        <div className="tenant-choice-content">
                          <Badge>{item.segment}</Badge>
                          <h2>{item.name}</h2>
                          <p>
                            <MapPin size={15} />
                            {item.address}
                          </p>
                          <p>{item.city}</p>
                          <div>
                            <span>Conhecer serviços</span>
                            <ArrowRight size={18} />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null}
                {step === "servico" ? (
                  <>
                    <div
                      className="filter-tabs"
                      aria-label="Categorias de serviços"
                    >
                      {[
                        "Todos",
                        ...new Set(
                          data.services
                            .filter(
                              (item) =>
                                item.tenantId === tenant?.id && item.active,
                            )
                            .map((item) => item.category),
                        ),
                      ].map((item) => (
                        <button
                          key={item}
                          onClick={() => setCategory(item)}
                          className={item === category ? "selected" : ""}
                          aria-pressed={item === category}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                    <div className="service-choices">
                      {data.services
                        .filter(
                          (item) =>
                            item.tenantId === tenant?.id &&
                            item.active &&
                            (category === "Todos" ||
                              item.category === category),
                        )
                        .map((item) => (
                          <button
                            type="button"
                            key={item.id}
                            className="service-choice"
                            onClick={() =>
                              go(
                                "/agendar/profissional",
                                { servico: item.id },
                                ["profissional", "data", "horario"],
                              )
                            }
                          >
                            <span className="service-choice-icon">
                              <Scissors size={22} />
                            </span>
                            <div>
                              <h2>{item.name}</h2>
                              <p>{item.description}</p>
                              <span>
                                <Clock3 size={13} />
                                {item.duration} min
                              </span>
                            </div>
                            <div className="service-price">
                              <strong>{currency(item.price)}</strong>
                              <ChevronRight size={18} />
                            </div>
                          </button>
                        ))}
                    </div>
                  </>
                ) : null}
                {step === "profissional" ? (
                  <div className="professional-choices">
                    {data.professionals
                      .filter(
                        (item) =>
                          item.tenantId === tenant?.id &&
                          item.active &&
                          item.serviceIds.includes(service?.id ?? ""),
                      )
                      .map((item) => (
                        <button
                          type="button"
                          className="professional-choice"
                          key={item.id}
                          onClick={() =>
                            go(
                              "/agendar/data-horario",
                              { profissional: item.id },
                              ["data", "horario"],
                            )
                          }
                        >
                          <Avatar initials={item.initials} color={item.color} />
                          <h2>{item.name}</h2>
                          <p>{item.specialty}</p>
                          <span>
                            Ver horários <ArrowRight size={16} />
                          </span>
                        </button>
                      ))}
                  </div>
                ) : null}
                {step === "data-horario" ? (
                  <>
                    <div className="date-time-grid">
                      <div>
                        <h2 className="selection-title">
                          <CalendarDays size={19} /> Escolha a data
                        </h2>
                        <DatePicker
                          value={date}
                          weekdays={tenant?.weekdays}
                          onChange={(value) => {
                            setDate(value);
                            setTime("");
                          }}
                        />
                      </div>
                      <div className="time-selection">
                        <h2 className="selection-title">
                          <Clock3 size={19} /> Horários disponíveis
                        </h2>
                        {!date ? (
                          <div className="time-placeholder">
                            <CalendarDays size={28} />
                            <p>
                              Selecione um dia no calendário
                              <br />
                              para encontrar seu horário.
                            </p>
                          </div>
                        ) : remoteSlots.loading ? (
                          <p role="status">Consultando horários…</p>
                        ) : remoteSlots.error ? (
                          <EmptyState
                            title="Não foi possível consultar os horários"
                            description={remoteSlots.error.message}
                            action={
                              <Button onClick={remoteSlots.retry}>
                                Tentar novamente
                              </Button>
                            }
                          />
                        ) : slots.length ? (
                          <>
                            <p className="time-date-label">
                              {dateLabel(date, {
                                weekday: "long",
                                day: "numeric",
                                month: "short",
                              })}
                            </p>
                            <div className="time-slots">
                              {slots.map((slot) => (
                                <button
                                  type="button"
                                  key={slot}
                                  onClick={() => setTime(slot)}
                                  aria-pressed={time === slot}
                                  className={time === slot ? "selected" : ""}
                                >
                                  {slot}
                                </button>
                              ))}
                            </div>
                          </>
                        ) : (
                          <EmptyState
                            title="Sem horários neste dia"
                            description="Experimente outra data ou volte para escolher outro profissional."
                          />
                        )}
                      </div>
                    </div>
                    <div className="booking-next">
                      <p>
                        <ShieldCheck size={16} /> Horário de São Paulo · UTC−3
                      </p>
                      <Button
                        disabled={!date || !time || !slots.includes(time)}
                        onClick={() =>
                          go("/agendar/cliente", { data: date, horario: time })
                        }
                      >
                        Continuar <ArrowRight size={17} />
                      </Button>
                    </div>
                  </>
                ) : null}
                {step === "cliente" ? (
                  <form className="customer-booking-form" onSubmit={confirm}>
                    <Field
                      label="Seu nome"
                      name="name"
                      placeholder="Como podemos te chamar?"
                      required
                      minLength={3}
                      maxLength={100}
                      autoComplete="name"
                    />
                    <div className="form-two">
                      <Field
                        label="Telefone com DDD"
                        name="phone"
                        type="tel"
                        placeholder="(11) 99999-9999"
                        required
                        pattern="[\d\s()+-]{10,17}"
                        maxLength={17}
                        autoComplete="tel"
                        hint={
                          demo
                            ? "Use um número fictício na demonstração."
                            : undefined
                        }
                      />
                      <Field
                        label="E-mail (opcional)"
                        name="email"
                        type="email"
                        placeholder="voce@example.com"
                        maxLength={150}
                        autoComplete="email"
                      />
                    </div>
                    {demo ? (
                      <label className="checkbox-label">
                        <input type="checkbox" required /> Entendo que este é um
                        agendamento de demonstração e estou usando dados
                        fictícios.
                      </label>
                    ) : null}
                    <InlineError>{error}</InlineError>
                    <div className="booking-next">
                      <p>
                        <ShieldCheck size={16} /> Nenhum pagamento nesta etapa.
                      </p>
                      <Button type="submit" busy={busy}>
                        Confirmar agendamento <CheckCheck size={17} />
                      </Button>
                    </div>
                  </form>
                ) : null}
                {index > 0 ? (
                  <button
                    className="back-step"
                    onClick={() => go(steps[index - 1].path, {})}
                  >
                    <ArrowLeft size={15} /> Voltar um passo
                  </button>
                ) : null}
              </section>
              <aside className="booking-summary">
                <div className="summary-top">
                  <span className="summary-icon">
                    <Scissors size={22} />
                  </span>
                  <div>
                    <p>SEU MOMENTO</p>
                    <h2>{tenant?.name ?? "Do seu jeito."}</h2>
                  </div>
                </div>
                {!tenant ? (
                  <p className="summary-intro">
                    Escolha um espaço para começar. A gente te acompanha até a
                    confirmação.
                  </p>
                ) : (
                  <>
                    <p className="summary-address">
                      <MapPin size={14} />
                      {tenant.address}
                    </p>
                    <hr />
                    <div className="summary-lines">
                      <div>
                        <Scissors size={17} />
                        <span>
                          <small>Serviço</small>
                          <strong>{service?.name ?? "Vamos escolher"}</strong>
                        </span>
                      </div>
                      <div>
                        <Users size={17} />
                        <span>
                          <small>Profissional</small>
                          <strong>
                            {professional?.name ?? "Do seu jeito"}
                          </strong>
                        </span>
                      </div>
                      <div>
                        <CalendarDays size={17} />
                        <span>
                          <small>Data e horário</small>
                          <strong>
                            {queryDate && queryTime
                              ? `${dateLabel(queryDate)} às ${queryTime}`
                              : date && time
                                ? `${dateLabel(date)} às ${time}`
                                : "Seu melhor momento"}
                          </strong>
                        </span>
                      </div>
                      {service ? (
                        <div>
                          <Clock3 size={17} />
                          <span>
                            <small>Duração estimada</small>
                            <strong>{service.duration} minutos</strong>
                          </span>
                        </div>
                      ) : null}
                    </div>
                    {service ? (
                      <div className="summary-total">
                        <span>Total do serviço</span>
                        <strong>{currency(service.price)}</strong>
                      </div>
                    ) : null}
                  </>
                )}
                <div className="summary-bottom">
                  <HeartNote />
                  Um cuidado de cada vez.
                  <br />O próximo pode ser o seu.
                </div>
              </aside>
            </div>
          </>
        )}
        <div className="booking-footer">
          <Credit />
          {demo ? (
            <span>
              <ShieldCheck size={13} /> Experiência demonstrativa
            </span>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function HeartNote() {
  return (
    <span className="summary-star" aria-hidden="true">
      ✦
    </span>
  );
}

function DemoBookingFlow({ step }: { step: BookingStep }) {
  const data = useDemo();
  const appointment = data?.appointments.find(
    (item) => item.id === data.lastBookingId,
  );
  const tenant = data?.tenants.find(
    (item) => item.id === appointment?.tenantId,
  );
  const confirmation = appointment
    ? {
        id: appointment.id,
        business: tenant?.name ?? "",
        address: tenant?.address ?? "",
        service:
          data?.services.find((item) => item.id === appointment.serviceId)
            ?.name ?? "",
        professional:
          data?.professionals.find(
            (item) => item.id === appointment.professionalId,
          )?.name ?? "",
        date: appointment.date,
        time: appointment.time,
        duration: appointment.duration,
        price: appointment.price,
      }
    : null;

  return (
    <BookingFlow
      step={step}
      data={data}
      lastBooking={confirmation}
      submit={(draft) => repository.createBooking(draft)}
      demoAppointments={data?.appointments}
    />
  );
}

function LiveBookingFlow({ step }: { step: BookingStep }) {
  const query = useSearchParams();
  const { catalog, error, retry } = useLiveCatalog({
    list: step === "unidade",
    confirmation: step === "confirmacao",
  });
  const confirmation = useLiveConfirmation(
    step === "confirmacao" ? query.get("reserva") : null,
  );

  return (
    <BookingFlow
      step={step}
      data={catalog}
      lastBooking={confirmation}
      catalogError={error?.message}
      retryCatalog={retry}
      submit={(draft, requestId) =>
        createLiveBooking(
          draft,
          requestId,
          catalog?.tenants.find((item) => item.id === draft.tenantId)
            ?.address ?? "",
        )
      }
    />
  );
}

export function BookingRoute({ step }: { step: BookingStep }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      {liveMode ? (
        <LiveBookingFlow step={step} />
      ) : (
        <DemoBookingFlow step={step} />
      )}
    </Suspense>
  );
}
