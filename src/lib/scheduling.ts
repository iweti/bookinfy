import type {
  Appointment,
  BookingDraft,
  DemoData,
  Service,
  Tenant,
} from "../types/domain.ts";
import { isISODate } from "./format.ts";

export const statusLabels = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  in_progress: "Em atendimento",
  completed: "Concluído",
  canceled: "Cancelado",
  no_show: "Não compareceu",
} as const;

export const blockingStatuses = new Set([
  "scheduled",
  "confirmed",
  "in_progress",
  "completed",
]);

export function minutes(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

export function timeOf(value: number) {
  return `${Math.floor(value / 60)
    .toString()
    .padStart(2, "0")}:${(value % 60).toString().padStart(2, "0")}`;
}

export function overlaps(
  start: string,
  duration: number,
  other: Pick<Appointment, "time" | "duration">,
) {
  return (
    minutes(start) < minutes(other.time) + other.duration &&
    minutes(start) + duration > minutes(other.time)
  );
}

export function availableSlots(
  tenant: Tenant,
  service: Service,
  professionalId: string,
  date: string,
  appointments: Appointment[],
  now = new Date(),
) {
  if (
    !isISODate(date) ||
    !tenant.weekdays.includes(new Date(`${date}T12:00:00Z`).getUTCDay())
  )
    return [];
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value ?? "";
  const today = `${part("year")}-${part("month")}-${part("day")}`;
  const currentMinute = Number(part("hour")) * 60 + Number(part("minute"));
  if (date < today) return [];
  const existing = appointments.filter(
    (item) =>
      item.tenantId === tenant.id &&
      item.professionalId === professionalId &&
      item.date === date &&
      blockingStatuses.has(item.status),
  );
  const slots: string[] = [];
  for (
    let start = minutes(tenant.open);
    start + service.duration <= minutes(tenant.close);
    start += 30
  ) {
    if (date === today && start <= currentMinute) continue;
    const time = timeOf(start);
    if (
      !existing.some((appointment) =>
        overlaps(time, service.duration, appointment),
      )
    )
      slots.push(time);
  }
  return slots;
}

export function validateBooking(
  data: DemoData,
  draft: BookingDraft,
  now = new Date(),
): string | null {
  const tenant = data.tenants.find((item) => item.id === draft.tenantId);
  const service = data.services.find(
    (item) =>
      item.id === draft.serviceId &&
      item.tenantId === draft.tenantId &&
      item.active,
  );
  const professional = data.professionals.find(
    (item) =>
      item.id === draft.professionalId &&
      item.tenantId === draft.tenantId &&
      item.active &&
      item.serviceIds.includes(draft.serviceId),
  );
  if (!tenant || !service || !professional)
    return "Selecione um serviço e um profissional disponíveis nesta unidade.";
  if (
    draft.customer.name.trim().length < 3 ||
    ![10, 11].includes(draft.customer.phone.replace(/\D/g, "").length)
  )
    return "Informe seu nome e um telefone com DDD válido.";
  if (
    draft.customer.email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.customer.email)
  )
    return "Informe um e-mail válido.";
  if (
    !availableSlots(
      tenant,
      service,
      professional.id,
      draft.date,
      data.appointments,
      now,
    ).includes(draft.time)
  )
    return "Esse horário não está mais disponível. Escolha outro horário.";
  return null;
}
