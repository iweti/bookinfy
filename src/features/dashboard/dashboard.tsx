"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock3,
  MoreHorizontal,
  Plus,
  Scissors,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import {
  Avatar,
  Badge,
  ButtonLink,
  EmptyState,
  PageHeading,
  PageSkeleton,
} from "@/components/ui/primitives";
import { useDemo } from "@/lib/data/use-demo";
import { addDays, currency, dateLabel, initials, todayISO } from "@/lib/format";
import { availableSlots, minutes, statusLabels } from "@/lib/scheduling";
import type { Appointment, DemoData } from "@/types/domain";

export function AppointmentBadge({
  status,
}: {
  status: Appointment["status"];
}) {
  const tone = {
    scheduled: "blue",
    confirmed: "green",
    in_progress: "purple",
    completed: "neutral",
    canceled: "red",
    no_show: "peach",
  };
  return (
    <Badge tone={tone[status]}>
      <i className="status-dot" />
      {statusLabels[status]}
    </Badge>
  );
}

export function MetricCard({
  label,
  value,
  note,
  icon: Icon,
  tone = "purple",
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof Wallet;
  tone?: string;
}) {
  return (
    <article className="metric-card">
      <div>
        <span>{label}</span>
        <span className={`metric-icon ${tone}`}>
          <Icon size={19} strokeWidth={1.6} />
        </span>
      </div>
      <strong>{value}</strong>
      <p>{note}</p>
    </article>
  );
}

export function AppointmentTable({
  appointments,
  data,
  compact = false,
  onSelect,
}: {
  appointments: Appointment[];
  data: DemoData;
  compact?: boolean;
  onSelect?: (appointment: Appointment) => void;
}) {
  if (!appointments.length)
    return (
      <EmptyState
        title="Um espaço para o próximo encontro."
        description="Não há atendimentos neste período. Novos agendamentos aparecerão aqui."
      />
    );
  return (
    <div
      className="table-scroll"
      role="region"
      aria-label="Tabela de atendimentos"
      tabIndex={0}
    >
      <table>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Serviço</th>
            <th>Horário</th>
            {!compact ? <th>Profissional</th> : null}
            <th>Status</th>
            {onSelect ? (
              <th>
                <span className="sr-only">Ver atendimento</span>
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {appointments.map((item) => {
            const customer = data.customers.find(
              (value) => value.id === item.customerId,
            );
            const professional = data.professionals.find(
              (value) => value.id === item.professionalId,
            );
            return (
              <tr key={item.id}>
                <td>
                  <div className="table-person">
                    <Avatar
                      initials={initials(customer?.name ?? "Cliente")}
                      color={professional?.color}
                      small
                    />
                    <div>
                      <strong>{customer?.name ?? "Cliente"}</strong>
                      <small>{customer?.phone}</small>
                    </div>
                  </div>
                </td>
                <td>
                  {
                    data.services.find((value) => value.id === item.serviceId)
                      ?.name
                  }
                </td>
                <td>
                  <strong>{item.time}</strong>
                  <small className="table-subtext">{item.duration} min</small>
                </td>
                {!compact ? <td>{professional?.name.split(" ")[0]}</td> : null}
                <td>
                  <AppointmentBadge status={item.status} />
                </td>
                {onSelect ? (
                  <td>
                    <button
                      className="icon-button"
                      aria-label={`Ver atendimento de ${customer?.name}`}
                      onClick={() => onSelect(item)}
                    >
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RevenueChart({
  data,
  start,
  end,
}: {
  data: Appointment[];
  start: string;
  end: string;
}) {
  const count =
    Math.round(
      (new Date(`${end}T12:00:00Z`).getTime() -
        new Date(`${start}T12:00:00Z`).getTime()) /
        86400000,
    ) + 1;
  const days = Array.from({ length: Math.max(1, count) }, (_, index) =>
    addDays(start, index),
  );
  const values = days.map((date) =>
    data
      .filter((item) => item.date === date && item.status === "completed")
      .reduce((sum, item) => sum + item.price, 0),
  );
  const max = Math.max(...values, 100);
  const points = values
    .map(
      (value, index) =>
        `${30 + (index / Math.max(1, values.length - 1)) * 560},${155 - (value / max) * 125}`,
    )
    .join(" ");
  return (
    <figure className="revenue-figure">
      <div className="chart-y-labels">
        <span>{currency(max)}</span>
        <span>{currency(max / 2)}</span>
        <span>R$ 0</span>
      </div>
      <div className="chart-plot">
        <svg
          viewBox="0 0 620 180"
          preserveAspectRatio="none"
          role="img"
          aria-label={`Receita de atendimentos concluídos: ${currency(values.reduce((sum, value) => sum + value, 0))} no período`}
        >
          <defs>
            <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9b6aef" stopOpacity=".25" />
              <stop offset="100%" stopColor="#9b6aef" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[30, 92, 155].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="620"
              y2={y}
              stroke="#ece9f1"
              strokeDasharray="4 4"
            />
          ))}
          <polygon
            points={`30,165 ${points} 590,165`}
            fill="url(#revenue-fill)"
          />
          <polyline
            points={points}
            fill="none"
            stroke="#8949e7"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          {values.length === 1 ? (
            <circle
              cx="30"
              cy={155 - (values[0] / max) * 125}
              r="4"
              fill="#8949e7"
            />
          ) : null}
        </svg>
        <div className="chart-x-labels">
          <span>{dateLabel(days[0], { day: "2-digit", month: "short" })}</span>
          <span>
            {dateLabel(days[Math.floor(days.length / 2)], {
              day: "2-digit",
              month: "short",
            })}
          </span>
          <span>
            {dateLabel(days[days.length - 1], {
              day: "2-digit",
              month: "short",
            })}
          </span>
        </div>
      </div>
      <figcaption className="sr-only">
        Receita diária no período.{" "}
        {days
          .map((day, i) => `${dateLabel(day)}: ${currency(values[i])}`)
          .join("; ")}
      </figcaption>
    </figure>
  );
}

export function Dashboard() {
  const data = useDemo();
  const [period, setPeriod] = useState("month");
  if (!data?.session) return <PageSkeleton />;
  if (data.session.role === "staff") return <StaffDashboard data={data} />;
  const today = todayISO();
  const tenant = data.tenants.find(
    (item) => item.id === data.session?.tenantId,
  )!;
  const weekDay = new Date(`${today}T12:00:00Z`).getUTCDay();
  const start =
    period === "week"
      ? addDays(today, -(weekDay === 0 ? 6 : weekDay - 1))
      : `${today.slice(0, 7)}-01`;
  const end =
    period === "week"
      ? addDays(start, 6)
      : new Date(
          Date.UTC(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0),
        )
          .toISOString()
          .slice(0, 10);
  const appointments = data.appointments.filter(
    (item) =>
      item.tenantId === tenant.id && item.date >= start && item.date <= end,
  );
  const active = appointments.filter(
    (item) => !["canceled", "no_show"].includes(item.status),
  );
  const revenue = active.reduce((sum, item) => sum + item.price, 0);
  const recovered = active
    .filter((item) => item.recovered)
    .reduce((sum, item) => sum + item.price, 0);
  const todayAppointments = data.appointments
    .filter((item) => item.tenantId === tenant.id && item.date === today)
    .sort((a, b) => a.time.localeCompare(b.time));
  const professionals = data.professionals.filter(
    (item) => item.tenantId === tenant.id && item.active,
  );
  const workingDays = Array.from(
    {
      length: Math.round((Date.parse(end) - Date.parse(start)) / 86400000) + 1,
    },
    (_, i) => addDays(start, i),
  ).filter((date) =>
    tenant.weekdays.includes(new Date(`${date}T12:00:00Z`).getUTCDay()),
  ).length;
  const capacity =
    workingDays *
    (minutes(tenant.close) - minutes(tenant.open)) *
    professionals.length;
  const occupancy = capacity
    ? Math.round(
        (active.reduce((sum, item) => sum + item.duration, 0) / capacity) * 100,
      )
    : 0;
  const completedToday = todayAppointments.filter(
    (item) => item.status === "completed",
  ).length;
  const distribution = data.services
    .filter((item) => item.tenantId === tenant.id)
    .map((service) => ({
      ...service,
      count: active.filter((item) => item.serviceId === service.id).length,
    }))
    .sort((a, b) => b.count - a.count);
  const busyHours = Object.entries(
    active.reduce<Record<string, number>>(
      (all, item) => ({
        ...all,
        [item.time.slice(0, 2)]: (all[item.time.slice(0, 2)] ?? 0) + 1,
      }),
      {},
    ),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  return (
    <>
      <PageHeading
        eyebrow="SEU NEGÓCIO, EM SINTONIA"
        title={`Tudo em dia, ${data.session.name.split(" ")[0]}. ✦`}
        description="Um olhar para sua rotina. Mais clareza para o próximo passo."
        action={
          <div className="heading-actions">
            <select
              aria-label="Período do dashboard"
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
            >
              <option value="month">Este mês</option>
              <option value="week">Esta semana</option>
            </select>
            <ButtonLink href="/app/agenda?novo=1">
              <Plus size={17} /> Novo agendamento
            </ButtonLink>
          </div>
        }
      />
      <div className="metrics-grid">
        <MetricCard
          label="Faturamento previsto"
          value={currency(revenue)}
          note="Concluídos + atendimentos previstos no período"
          icon={Wallet}
        />
        <MetricCard
          label="Faturamento recuperado"
          value={currency(recovered)}
          note="Cenário simulado · sem automação ativa"
          icon={TrendingUp}
          tone="green"
        />
        <MetricCard
          label="Agendamentos"
          value={appointments.length.toString().padStart(2, "0")}
          note={`${active.length} ativos no período selecionado`}
          icon={CalendarDays}
          tone="blue"
        />
        <MetricCard
          label="Ocupação da agenda"
          value={`${occupancy}%`}
          note="Minutos reservados / capacidade do período"
          icon={Clock3}
          tone="peach"
        />
      </div>
      <div className="dashboard-middle">
        <section className="panel revenue-panel">
          <div className="panel-heading">
            <div>
              <h2>Seu negócio em movimento</h2>
              <p>Receita dos atendimentos concluídos</p>
            </div>
            <Badge tone="neutral">
              <i className="chart-legend" /> Receita
            </Badge>
          </div>
          <RevenueChart data={appointments} start={start} end={today} />
          <div className="chart-footer">
            <span>
              <i className="status-dot red" />{" "}
              {appointments.filter((item) => item.status === "canceled").length}{" "}
              cancelamentos
            </span>
            <span>
              <i className="status-dot peach" />{" "}
              {appointments.filter((item) => item.status === "no_show").length}{" "}
              faltas
            </span>
            <span>
              <i className="status-dot green" />{" "}
              {
                appointments.filter((item) => item.status === "completed")
                  .length
              }{" "}
              concluídos
            </span>
          </div>
        </section>
        <section className="panel today-panel">
          <div className="panel-heading">
            <div>
              <h2>Seu dia, de perto.</h2>
              <p>
                {dateLabel(today, {
                  weekday: "long",
                  day: "numeric",
                  month: "short",
                })}
              </p>
            </div>
            <span className="today-sparkle">✦</span>
          </div>
          <div className="day-progress">
            <svg viewBox="0 0 120 120" aria-hidden="true">
              <circle
                cx="60"
                cy="60"
                r="49"
                fill="none"
                stroke="#eee7f9"
                strokeWidth="9"
              />
              <circle
                cx="60"
                cy="60"
                r="49"
                fill="none"
                stroke="#8b4be6"
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={`${todayAppointments.length ? (completedToday / todayAppointments.length) * 308 : 0} 308`}
                transform="rotate(-90 60 60)"
              />
            </svg>
            <div>
              <strong>
                {todayAppointments.length.toString().padStart(2, "0")}
              </strong>
              <span>atendimentos hoje</span>
            </div>
          </div>
          <div className="today-mini-stats">
            <span>
              <strong>{completedToday}</strong>Concluídos
            </span>
            <span>
              <strong>
                {
                  todayAppointments.filter((item) =>
                    ["scheduled", "confirmed", "in_progress"].includes(
                      item.status,
                    ),
                  ).length
                }
              </strong>
              Por atender
            </span>
          </div>
          <Link href="/app/agenda" className="panel-link">
            Abrir minha agenda <ArrowRight size={16} />
          </Link>
        </section>
      </div>
      <div className="dashboard-bottom">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Os encontros de hoje</h2>
              <p>Gente que faz parte do seu dia.</p>
            </div>
            <Link href="/app/agenda" className="subtle-link">
              Ver agenda <ArrowUpRight size={15} />
            </Link>
          </div>
          <AppointmentTable
            appointments={todayAppointments.slice(0, 4)}
            data={data}
            compact
          />
        </section>
        <section className="panel top-services-panel">
          <div className="panel-heading">
            <div>
              <h2>Os favoritos da agenda</h2>
              <p>Serviços mais reservados no período</p>
            </div>
            <Scissors size={18} />
          </div>
          <div className="rank-list">
            {distribution.slice(0, 3).map((item, i) => (
              <div key={item.id}>
                <span className="rank-index">0{i + 1}</span>
                <div>
                  <strong>{item.name}</strong>
                  <div className="rank-track">
                    <i
                      style={{
                        width: `${active.length ? (item.count / active.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <span>{item.count}</span>
              </div>
            ))}
          </div>
          <div className="busy-hours">
            <p>
              <Clock3 size={14} /> Horários de maior movimento
            </p>
            <div>
              {busyHours.length ? (
                busyHours.map(([hour, count]) => (
                  <span key={hour}>
                    {hour}h <small>· {count} reservas</small>
                  </span>
                ))
              ) : (
                <span>Sem reservas no período</span>
              )}
            </div>
          </div>
        </section>
      </div>
      <div className="dashboard-bottom-note">
        <Sparkles size={16} />
        <span>Organização hoje. Novas possibilidades amanhã.</span>
        <Link href="/app/lista-espera">
          Conhecer a lista de espera <ArrowRight size={14} />
        </Link>
      </div>
    </>
  );
}

function StaffDashboard({ data }: { data: DemoData }) {
  const today = todayISO();
  const professional = data.professionals.find(
    (item) => item.id === data.session?.professionalId,
  );
  const tenant = data.tenants.find(
    (item) => item.id === data.session?.tenantId,
  )!;
  const appointments = data.appointments
    .filter(
      (item) =>
        item.tenantId === tenant.id &&
        item.professionalId === professional?.id &&
        item.date === today,
    )
    .sort((a, b) => a.time.localeCompare(b.time));
  const service = data.services.find(
    (item) =>
      item.tenantId === tenant.id &&
      item.active &&
      professional?.serviceIds.includes(item.id),
  );
  const free =
    service && professional
      ? availableSlots(
          tenant,
          service,
          professional.id,
          today,
          data.appointments,
        )
      : [];
  return (
    <>
      <PageHeading
        eyebrow="SEU TEMPO PARA CUIDAR"
        title={`Seu dia, ${data.session?.name.split(" ")[0]}. ✦`}
        description={dateLabel(today, {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
        action={
          <ButtonLink href="/app/agenda">
            Abrir minha agenda <ArrowRight size={16} />
          </ButtonLink>
        }
      />
      <div className="grid-three">
        <MetricCard
          label="Atendimentos hoje"
          value={String(appointments.length).padStart(2, "0")}
          note="Somente a sua agenda"
          icon={CalendarDays}
        />
        <MetricCard
          label="Concluídos"
          value={String(
            appointments.filter((item) => item.status === "completed").length,
          ).padStart(2, "0")}
          note="Encontros finalizados no dia"
          icon={Check}
          tone="green"
        />
        <MetricCard
          label="Próximos atendimentos"
          value={String(
            appointments.filter((item) =>
              ["confirmed", "scheduled", "in_progress"].includes(item.status),
            ).length,
          ).padStart(2, "0")}
          note="Agendados, confirmados e em atendimento"
          icon={Users}
          tone="blue"
        />
      </div>
      <section className="panel staff-panel">
        <div className="panel-heading">
          <div>
            <h2>Seus encontros de hoje</h2>
            <p>O cuidado começa com uma rotina organizada.</p>
          </div>
          <Badge>{professional?.specialty}</Badge>
        </div>
        <AppointmentTable appointments={appointments} data={data} compact />
      </section>
      <section className="panel staff-panel">
        <div className="panel-heading">
          <div>
            <h2>Espaço para o próximo cuidado</h2>
            <p>
              Horários livres hoje para{" "}
              {service?.name.toLowerCase() ?? "atendimento"}.
            </p>
          </div>
          <Clock3 size={20} />
        </div>
        <div className="free-slot-list">
          {free.length ? (
            free.map((slot) => <span key={slot}>{slot}</span>)
          ) : (
            <p className="text-muted">Não há mais horários disponíveis hoje.</p>
          )}
        </div>
      </section>
    </>
  );
}
