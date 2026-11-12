"use client";

import { useSearchParams } from "next/navigation";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Phone,
  Plus,
  Search,
  Scissors,
  User,
} from "lucide-react";
import { Suspense, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  Field,
  InlineError,
  Modal,
  PageHeading,
  PageSkeleton,
  useToast,
} from "@/components/ui/primitives";
import { useDemo } from "@/lib/data/use-demo";
import { repository } from "@/lib/data/mock-repository";
import { addDays, currency, dateLabel, todayISO } from "@/lib/format";
import {
  availableSlots,
  minutes,
  statusLabels,
  timeOf,
} from "@/lib/scheduling";
import {
  AppointmentBadge,
  AppointmentTable,
} from "@/features/dashboard/dashboard";
import type { Appointment, AppointmentStatus, DemoData } from "@/types/domain";

function AgendaContent() {
  const data = useDemo();
  const params = useSearchParams();
  const [date, setDate] = useState(todayISO());
  const [view, setView] = useState<"day" | "week" | "list">("day");
  const [professionalFilter, setProfessionalFilter] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(params.get("novo") === "1");
  if (!data?.session) return <PageSkeleton />;
  const staff = data.session.role === "staff";
  const tenantId = data.session.tenantId;
  const tenant = data.tenants.find((item) => item.id === tenantId)!;
  const allProfessionals = data.professionals.filter(
    (item) =>
      item.tenantId === tenantId &&
      (!staff || item.id === data.session?.professionalId),
  );
  const activeFilter = allProfessionals.some(
    (item) => item.id === professionalFilter,
  )
    ? professionalFilter
    : "all";
  const professionals = allProfessionals.filter(
    (item) => activeFilter === "all" || item.id === activeFilter,
  );
  const dayOfWeek = new Date(`${date}T12:00:00Z`).getUTCDay();
  const startWeek = addDays(date, -(dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const week = Array.from({ length: 7 }, (_, i) => addDays(startWeek, i));
  const appointments = data.appointments
    .filter(
      (item) =>
        item.tenantId === tenantId &&
        professionals.some(
          (professional) => professional.id === item.professionalId,
        ) &&
        (view === "week" ? week.includes(item.date) : item.date === date) &&
        (status === "all" || item.status === status) &&
        `${data.customers.find((customer) => customer.id === item.customerId)?.name} ${data.services.find((service) => service.id === item.serviceId)?.name}`
          .toLocaleLowerCase("pt-BR")
          .includes(search.toLocaleLowerCase("pt-BR")),
    )
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  const selected = data.appointments.find(
    (item) =>
      item.id === selectedId &&
      item.tenantId === tenantId &&
      (!staff || item.professionalId === data.session?.professionalId),
  );
  const calendarAppointments = appointments.filter(
    (item) => !["canceled", "no_show"].includes(item.status),
  );
  const historyAppointments = appointments.filter((item) =>
    ["canceled", "no_show"].includes(item.status),
  );
  const gridStart =
    Math.floor(
      Math.min(
        minutes(tenant.open),
        ...calendarAppointments.map((item) => minutes(item.time)),
      ) / 30,
    ) * 30;
  const gridEnd =
    Math.ceil(
      Math.max(
        minutes(tenant.close),
        ...calendarAppointments.map(
          (item) => minutes(item.time) + item.duration,
        ),
      ) / 30,
    ) * 30;
  const slots = Array.from({ length: (gridEnd - gridStart) / 30 }, (_, i) =>
    timeOf(gridStart + i * 30),
  );
  return (
    <>
      <PageHeading
        eyebrow={staff ? "SEU TEMPO PARA CUIDAR" : "CADA ENCONTRO NO SEU TEMPO"}
        title={staff ? "Minha agenda" : "Uma agenda que flui."}
        description={
          staff
            ? "Seus atendimentos, seus horários e o próximo cuidado."
            : "Organize os encontros de hoje e abra espaço para os próximos."
        }
        action={
          !staff ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={17} /> Novo agendamento
            </Button>
          ) : (
            <Badge>Agenda individual</Badge>
          )
        }
      />
      <div className="agenda-topbar">
        <div className="date-navigation">
          <Button variant="secondary" onClick={() => setDate(todayISO())}>
            Hoje
          </Button>
          <button
            className="icon-button"
            aria-label={view === "week" ? "Semana anterior" : "Dia anterior"}
            onClick={() => setDate(addDays(date, view === "week" ? -7 : -1))}
          >
            <ChevronLeft size={19} />
          </button>
          <button
            className="icon-button"
            aria-label={view === "week" ? "Próxima semana" : "Próximo dia"}
            onClick={() => setDate(addDays(date, view === "week" ? 7 : 1))}
          >
            <ChevronRight size={19} />
          </button>
          <label className="agenda-date">
            <CalendarDays size={17} />
            <input
              aria-label="Data da agenda"
              type="date"
              value={date}
              onChange={(event) => {
                if (event.target.value) setDate(event.target.value);
              }}
            />
          </label>
        </div>
        <div className="filter-tabs" aria-label="Visualização da agenda">
          {(
            [
              { id: "day", label: "Dia" },
              { id: "week", label: "Semana" },
              { id: "list", label: "Lista" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              aria-pressed={view === item.id}
              className={view === item.id ? "selected" : ""}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <section className="panel agenda-panel">
        <div className="agenda-filters">
          <label className="search-field">
            <Search size={17} />
            <input
              aria-label="Buscar atendimento"
              placeholder="Buscar cliente ou serviço..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <div>
            {!staff ? (
              <select
                aria-label="Filtrar por profissional"
                value={activeFilter}
                onChange={(event) => setProfessionalFilter(event.target.value)}
              >
                <option value="all">Todos os profissionais</option>
                {allProfessionals.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            ) : null}
            <select
              aria-label="Filtrar por status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="all">Todos os status</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="agenda-day-title">
          <h2>
            {view === "week"
              ? `${dateLabel(startWeek, { day: "numeric", month: "short" })} a ${dateLabel(week[6], { day: "numeric", month: "short" })}`
              : dateLabel(date, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
          </h2>
          <span>
            {appointments.length}{" "}
            {appointments.length === 1 ? "atendimento" : "atendimentos"}
          </span>
        </div>
        {view === "list" ? (
          <AppointmentTable
            data={data}
            appointments={appointments}
            onSelect={(item) => setSelectedId(item.id)}
          />
        ) : view === "week" ? (
          <div className="week-scroll">
            <div className="week-calendar">
              {week.map((day) => (
                <div
                  className={`week-column ${day === todayISO() ? "is-today" : ""}`}
                  key={day}
                >
                  <button
                    className="week-day-header"
                    onClick={() => {
                      setDate(day);
                      setView("day");
                    }}
                  >
                    <span>{dateLabel(day, { weekday: "short" })}</span>
                    <strong>{dateLabel(day, { day: "numeric" })}</strong>
                  </button>
                  <div className="week-appointments">
                    {appointments
                      .filter((item) => item.date === day)
                      .map((item) => (
                        <AppointmentCard
                          key={item.id}
                          appointment={item}
                          data={data}
                          onClick={() => setSelectedId(item.id)}
                        />
                      ))}
                    {!appointments.some((item) => item.date === day) ? (
                      <span className="week-empty">Agenda livre</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : professionals.length ? (
          <div
            className="calendar-scroll"
            role="region"
            aria-label="Agenda por profissional"
            tabIndex={0}
          >
            <div
              className="agenda-calendar"
              style={
                {
                  "--columns": professionals.length,
                  "--rows": slots.length,
                } as CSSProperties
              }
            >
              <div className="time-column-heading">Horário</div>
              {professionals.map((professional, i) => (
                <div
                  className="professional-column-heading"
                  key={professional.id}
                  style={{ gridColumn: i + 2, gridRow: 1 }}
                >
                  <Avatar
                    initials={professional.initials}
                    color={professional.color}
                    small
                  />
                  <div>
                    <strong>{professional.name.split(" ")[0]}</strong>
                    <span>
                      {
                        data.appointments.filter(
                          (item) =>
                            item.date === date &&
                            item.professionalId === professional.id &&
                            item.tenantId === tenantId,
                        ).length
                      }{" "}
                      encontros
                    </span>
                  </div>
                </div>
              ))}
              {slots.map((slot, row) => (
                <div
                  className="calendar-time-label"
                  key={slot}
                  style={{ gridRow: row + 2, gridColumn: 1 }}
                >
                  {slot}
                </div>
              ))}
              {professionals.flatMap((professional, column) =>
                slots.map((slot, row) => (
                  <div
                    key={`${professional.id}-${slot}`}
                    className="calendar-cell"
                    style={{ gridColumn: column + 2, gridRow: row + 2 }}
                  />
                )),
              )}
              {calendarAppointments.map((item) => (
                <div
                  className="calendar-event"
                  key={item.id}
                  style={{
                    gridColumn:
                      professionals.findIndex(
                        (professional) =>
                          professional.id === item.professionalId,
                      ) + 2,
                    gridRow: `${Math.floor((minutes(item.time) - gridStart) / 30) + 2} / span ${Math.max(1, Math.ceil(item.duration / 30))}`,
                  }}
                >
                  <AppointmentCard
                    appointment={item}
                    data={data}
                    onClick={() => setSelectedId(item.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            title="Sua equipe começa aqui."
            description="Cadastre um profissional para organizar os primeiros atendimentos."
          />
        )}
        {view === "day" && historyAppointments.length ? (
          <div className="agenda-history">
            <h3>Cancelamentos e faltas · histórico do dia</h3>
            <AppointmentTable
              appointments={historyAppointments}
              data={data}
              compact
              onSelect={(item) => setSelectedId(item.id)}
            />
          </div>
        ) : null}
        {view !== "list" && !appointments.length ? (
          <div className="agenda-empty-note">
            <CalendarDays size={16} /> Nenhum atendimento para os filtros
            selecionados.
          </div>
        ) : null}
        <div className="agenda-legend">
          <span>
            <i className="status-dot purple" /> Agendado / confirmado
          </span>
          <span>
            <i className="status-dot green" /> Concluído
          </span>
          <span>
            <i className="status-dot red" /> Cancelado / falta
          </span>
          <span>Horário de São Paulo · UTC−3</span>
        </div>
      </section>
      {selected ? (
        <AppointmentDetails
          key={selected.id}
          appointment={selected}
          data={data}
          onClose={() => setSelectedId(null)}
        />
      ) : null}
      {createOpen && !staff ? (
        <Modal
          title="Um novo encontro."
          description="Agende um atendimento no ambiente demonstrativo."
          onClose={() => setCreateOpen(false)}
        >
          <NewAppointmentForm
            data={data}
            initialDate={date}
            onDone={() => setCreateOpen(false)}
          />
        </Modal>
      ) : null}
    </>
  );
}

function AppointmentCard({
  appointment,
  data,
  onClick,
}: {
  appointment: Appointment;
  data: DemoData;
  onClick: () => void;
}) {
  const professional = data.professionals.find(
    (item) => item.id === appointment.professionalId,
  );
  return (
    <button
      className={`appointment-card appointment-${professional?.color ?? "purple"} appointment-status-${appointment.status}`}
      onClick={onClick}
    >
      <div>
        <strong>{appointment.time}</strong>
        <span>{appointment.duration} min</span>
      </div>
      <strong>
        {
          data.customers.find((item) => item.id === appointment.customerId)
            ?.name
        }
      </strong>
      <span>
        {data.services.find((item) => item.id === appointment.serviceId)?.name}
      </span>
      <small>{statusLabels[appointment.status]}</small>
    </button>
  );
}

function AppointmentDetails({
  appointment,
  data,
  onClose,
}: {
  appointment: Appointment;
  data: DemoData;
  onClose: () => void;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cancel, setCancel] = useState(false);
  const [reschedule, setReschedule] = useState(false);
  const [date, setDate] = useState(
    appointment.date < todayISO() ? todayISO() : appointment.date,
  );
  const [time, setTime] = useState("");
  const service = data.services.find(
    (item) => item.id === appointment.serviceId,
  )!;
  const professional = data.professionals.find(
    (item) => item.id === appointment.professionalId,
  )!;
  const customer = data.customers.find(
    (item) => item.id === appointment.customerId,
  )!;
  const tenant = data.tenants.find((item) => item.id === appointment.tenantId)!;
  const canChange = ["scheduled", "confirmed", "in_progress"].includes(
    appointment.status,
  );
  const slots = availableSlots(
    tenant,
    { ...service, duration: appointment.duration },
    professional.id,
    date,
    data.appointments.filter((item) => item.id !== appointment.id),
  );
  async function changeStatus(status: AppointmentStatus) {
    setBusy(true);
    setError("");
    try {
      await repository.updateAppointment(appointment.id, status);
      toast(`Atendimento: ${statusLabels[status].toLowerCase()}.`);
      setCancel(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  async function saveReschedule(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await repository.rescheduleAppointment(appointment.id, date, time);
      toast("Atendimento remarcado na demonstração.");
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível remarcar.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title="Os detalhes do encontro."
      description="Acompanhe e organize este atendimento."
      onClose={onClose}
    >
      <div className="appointment-detail">
        <div className="detail-customer">
          <Avatar
            initials={customer.name
              .split(" ")
              .map((item) => item[0])
              .slice(0, 2)
              .join("")}
            color={professional.color}
          />
          <div>
            <h3>{customer.name}</h3>
            <span>
              <Phone size={14} /> {customer.phone}
            </span>
          </div>
          <AppointmentBadge status={appointment.status} />
        </div>
        <div className="detail-facts">
          <div>
            <Scissors size={18} />
            <span>
              Serviço<strong>{service.name}</strong>
            </span>
          </div>
          <div>
            <User size={18} />
            <span>
              Profissional<strong>{professional.name}</strong>
            </span>
          </div>
          <div>
            <CalendarDays size={18} />
            <span>
              Data<strong>{dateLabel(appointment.date)}</strong>
            </span>
          </div>
          <div>
            <Clock3 size={18} />
            <span>
              Horário
              <strong>
                {appointment.time} · {appointment.duration} min
              </strong>
            </span>
          </div>
        </div>
        {customer.notes ? (
          <p className="detail-note">{customer.notes}</p>
        ) : null}
        {data.session?.role === "owner" ? (
          <div className="summary-total">
            <span>Valor do atendimento</span>
            <strong>{currency(appointment.price)}</strong>
          </div>
        ) : null}
        <InlineError>{error}</InlineError>
        {cancel ? (
          <div className="confirmation-inline">
            <strong>Cancelar este encontro?</strong>
            <p>
              O horário será liberado na demonstração. Nenhuma mensagem será
              enviada.
            </p>
            <div>
              <Button variant="secondary" onClick={() => setCancel(false)}>
                Manter atendimento
              </Button>
              <Button
                variant="danger"
                busy={busy}
                onClick={() => void changeStatus("canceled")}
              >
                Confirmar cancelamento
              </Button>
            </div>
          </div>
        ) : reschedule ? (
          <form onSubmit={saveReschedule} className="reschedule-form">
            <Field
              label="Nova data"
              type="date"
              min={todayISO()}
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                setTime("");
              }}
              required
            />
            <div className="field">
              <label htmlFor="reschedule-time">Novo horário</label>
              <select
                id="reschedule-time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                required
              >
                <option value="">Selecione um horário</option>
                {slots.map((slot) => (
                  <option key={slot}>{slot}</option>
                ))}
              </select>
              {!slots.length ? <small>Sem horários nesta data.</small> : null}
            </div>
            <div className="form-actions">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setReschedule(false)}
              >
                Voltar
              </Button>
              <Button busy={busy} disabled={!time}>
                Salvar remarcação
              </Button>
            </div>
          </form>
        ) : canChange ? (
          <>
            <div className="detail-primary-actions">
              {appointment.status === "scheduled" ? (
                <Button
                  busy={busy}
                  onClick={() => void changeStatus("confirmed")}
                >
                  <Check size={17} /> Confirmar presença
                </Button>
              ) : appointment.status === "confirmed" ? (
                <Button
                  busy={busy}
                  onClick={() => void changeStatus("in_progress")}
                >
                  <Clock3 size={17} /> Iniciar atendimento
                </Button>
              ) : (
                <Button
                  busy={busy}
                  onClick={() => void changeStatus("completed")}
                >
                  <Check size={17} /> Concluir atendimento
                </Button>
              )}
              {data.session?.role === "owner" &&
              appointment.status !== "in_progress" ? (
                <Button variant="secondary" onClick={() => setReschedule(true)}>
                  Remarcar
                </Button>
              ) : null}
            </div>
            <div className="detail-secondary-actions">
              <button onClick={() => setCancel(true)} className="text-danger">
                Cancelar atendimento
              </button>
              {appointment.status !== "in_progress" ? (
                <button
                  disabled={busy}
                  onClick={() => void changeStatus("no_show")}
                >
                  Registrar falta
                </button>
              ) : null}
            </div>
          </>
        ) : (
          <p className="detail-closed">
            Este atendimento foi finalizado. O histórico está preservado.
          </p>
        )}
      </div>
    </Modal>
  );
}

function NewAppointmentForm({
  data,
  initialDate,
  onDone,
}: {
  data: DemoData;
  initialDate: string;
  onDone: () => void;
}) {
  const tenantId = data.session!.tenantId;
  const tenant = data.tenants.find((item) => item.id === tenantId)!;
  const services = data.services.filter(
    (item) => item.tenantId === tenantId && item.active,
  );
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const professionals = data.professionals.filter(
    (item) =>
      item.tenantId === tenantId &&
      item.active &&
      item.serviceIds.includes(serviceId),
  );
  const [professionalId, setProfessionalId] = useState("");
  const professional =
    professionals.find((item) => item.id === professionalId) ??
    professionals[0];
  const service = services.find((item) => item.id === serviceId);
  const [date, setDate] = useState(
    initialDate < todayISO() ? todayISO() : initialDate,
  );
  const [time, setTime] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const slots =
    service && professional
      ? availableSlots(
          tenant,
          service,
          professional.id,
          date,
          data.appointments,
        )
      : [];
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!service || !professional) return;
    const fields = new FormData(event.currentTarget);
    const customer = data.customers.find(
      (item) => item.id === customerId && item.tenantId === tenantId,
    ) ?? {
      name: String(fields.get("name")),
      phone: String(fields.get("phone")),
      email: "",
    };
    setBusy(true);
    setError("");
    try {
      const result = await repository.createBooking(
        {
          tenantId,
          serviceId,
          professionalId: professional.id,
          date,
          time,
          customer,
        },
        "manual",
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      toast("Um novo encontro foi adicionado à agenda.");
      onDone();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível agendar.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="management-form" onSubmit={submit}>
      <div className="field">
        <label htmlFor="new-customer">Cliente</label>
        <select
          id="new-customer"
          value={customerId}
          onChange={(event) => setCustomerId(event.target.value)}
        >
          <option value="">Novo cliente</option>
          {data.customers
            .filter((item) => item.tenantId === tenantId)
            .map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
        </select>
      </div>
      {!customerId ? (
        <div className="form-two">
          <Field
            label="Nome do cliente"
            name="name"
            required
            minLength={3}
            maxLength={100}
          />
          <Field
            label="Telefone com DDD"
            name="phone"
            type="tel"
            required
            pattern="[\d\s()+-]{10,17}"
            maxLength={17}
          />
        </div>
      ) : null}
      <div className="form-two">
        <div className="field">
          <label htmlFor="new-service">Serviço</label>
          <select
            id="new-service"
            value={serviceId}
            onChange={(event) => {
              setServiceId(event.target.value);
              setProfessionalId("");
              setTime("");
            }}
            required
          >
            {services.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="new-professional">Profissional</label>
          <select
            id="new-professional"
            value={professional?.id ?? ""}
            onChange={(event) => {
              setProfessionalId(event.target.value);
              setTime("");
            }}
            required
          >
            {professionals.length ? (
              professionals.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))
            ) : (
              <option value="">Sem profissionais</option>
            )}
          </select>
        </div>
      </div>
      <div className="form-two">
        <Field
          label="Data"
          type="date"
          min={todayISO()}
          value={date}
          onChange={(event) => {
            setDate(event.target.value);
            setTime("");
          }}
          required
        />
        <div className="field">
          <label htmlFor="new-time">Horário</label>
          <select
            id="new-time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
            required
          >
            <option value="">Selecione</option>
            {slots.map((slot) => (
              <option key={slot}>{slot}</option>
            ))}
          </select>
        </div>
      </div>
      {!slots.length ? (
        <p className="form-hint">
          Sem horários disponíveis. Escolha outra data ou profissional.
        </p>
      ) : null}
      {service ? (
        <div className="summary-total">
          <span>{service.duration} minutos de cuidado</span>
          <strong>{currency(service.price)}</strong>
        </div>
      ) : null}
      <InlineError>{error}</InlineError>
      <div className="form-actions">
        <Button type="button" variant="ghost" onClick={onDone}>
          Voltar
        </Button>
        <Button
          type="submit"
          busy={busy}
          disabled={!time || !service || !professional}
        >
          Adicionar à agenda <Plus size={16} />
        </Button>
      </div>
    </form>
  );
}

export function Agenda() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AgendaContent />
    </Suspense>
  );
}
