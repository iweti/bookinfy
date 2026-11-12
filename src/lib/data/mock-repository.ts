"use client";

import { createSeed } from "@/mocks/seed";
import { phoneDigits, todayISO } from "@/lib/format";
import { availableSlots, validateBooking } from "@/lib/scheduling";
import { demoDataSchema } from "./schema";
import type { BookingRepository, DemoSnapshot } from "./repository";
import type { DemoData, Role } from "@/types/domain";

const STORAGE_KEY = "bookinfy.demo.v1";
let snapshot: DemoSnapshot = null;
const listeners = new Set<() => void>();

function readData(): DemoData {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = demoDataSchema.safeParse(JSON.parse(stored));
      if (parsed.success) return parsed.data;
    }
  } catch {
    /* Storage can be unavailable in private browsing. The demo still works. */
  }
  return createSeed(todayISO());
}

function current() {
  if (!snapshot) snapshot = readData();
  return snapshot;
}

function publish(next: DemoData) {
  snapshot = demoDataSchema.parse(next);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    window.dispatchEvent(new Event("bookinfy:storage-unavailable"));
  }
  listeners.forEach((listener) => listener());
}

function handleStorage(event: StorageEvent) {
  if (event.key === STORAGE_KEY || event.key === null) {
    snapshot = readData();
    listeners.forEach((notify) => notify());
  }
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!snapshot) snapshot = readData();
  if (listeners.size === 1) window.addEventListener("storage", handleStorage);
  return () => {
    listeners.delete(listener);
    if (!listeners.size) window.removeEventListener("storage", handleStorage);
  };
}

export const getSnapshot = () => snapshot;
export const getServerSnapshot = (): DemoSnapshot => null;
export const newId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

function requireRole(role: Role) {
  if (current().session?.role !== role)
    throw new Error(
      "Este recurso está disponível no perfil de dono da demonstração.",
    );
}

function requireOwnerTenant(tenantId: string) {
  requireRole("owner");
  if (current().session?.tenantId !== tenantId)
    throw new Error(
      "Selecione a unidade correspondente antes de alterar este cadastro.",
    );
}

function upsert<T extends { id: string }>(list: T[], value: T): T[] {
  return list.some((item) => item.id === value.id)
    ? list.map((item) => (item.id === value.id ? value : item))
    : [...list, value];
}

export const repository: BookingRepository = {
  async createBooking(draft, source = "online") {
    const data = current();
    if (source === "manual") requireOwnerTenant(draft.tenantId);
    const error = validateBooking(data, draft);
    if (error) return { error };
    const service = data.services.find((item) => item.id === draft.serviceId)!;
    const phone = phoneDigits(draft.customer.phone);
    const existing = data.customers.find(
      (item) =>
        item.tenantId === draft.tenantId && phoneDigits(item.phone) === phone,
    );
    const customer = existing ?? {
      ...draft.customer,
      name: draft.customer.name.trim(),
      phone,
      id: newId("customer"),
      tenantId: draft.tenantId,
      notes: "",
    };
    const appointment = {
      id: newId("booking"),
      tenantId: draft.tenantId,
      customerId: customer.id,
      serviceId: service.id,
      professionalId: draft.professionalId,
      date: draft.date,
      time: draft.time,
      duration: service.duration,
      price: service.price,
      status: "scheduled" as const,
      source,
      recovered: false,
    };
    publish({
      ...data,
      customers: existing ? data.customers : [...data.customers, customer],
      appointments: [...data.appointments, appointment],
      lastBookingId: appointment.id,
    });
    return { appointment };
  },
  async updateAppointment(id, status) {
    const data = current();
    const appointment = data.appointments.find((item) => item.id === id);
    if (
      !data.session ||
      !appointment ||
      appointment.tenantId !== data.session.tenantId ||
      (data.session.role === "staff" &&
        appointment.professionalId !== data.session.professionalId)
    )
      throw new Error("Atendimento indisponível para este perfil.");
    const transitions: Record<typeof status, (typeof status)[]> = {
      scheduled: ["confirmed", "canceled", "no_show"],
      confirmed: ["in_progress", "canceled", "no_show"],
      in_progress: ["completed", "canceled"],
      completed: [],
      canceled: [],
      no_show: [],
    };
    if (!transitions[appointment.status].includes(status))
      throw new Error("Esta alteração de status não está disponível.");
    publish({
      ...data,
      appointments: data.appointments.map((item) =>
        item.id === id ? { ...item, status } : item,
      ),
    });
  },
  async rescheduleAppointment(id, date, time) {
    requireRole("owner");
    const data = current();
    const appointment = data.appointments.find((item) => item.id === id);
    if (
      !appointment ||
      !["scheduled", "confirmed"].includes(appointment.status)
    )
      throw new Error(
        "Somente atendimentos agendados ou confirmados podem ser remarcados.",
      );
    requireOwnerTenant(appointment.tenantId);
    const tenant = data.tenants.find(
      (item) => item.id === appointment.tenantId,
    )!;
    const service = data.services.find(
      (item) => item.id === appointment.serviceId,
    )!;
    if (
      !availableSlots(
        tenant,
        { ...service, duration: appointment.duration },
        appointment.professionalId,
        date,
        data.appointments.filter((item) => item.id !== id),
      ).includes(time)
    )
      throw new Error("Horário indisponível para este atendimento.");
    publish({
      ...data,
      appointments: data.appointments.map((item) =>
        item.id === id ? { ...item, date, time } : item,
      ),
    });
  },
  async saveCustomer(value) {
    requireOwnerTenant(value.tenantId);
    const data = current();
    if (
      ![10, 11].includes(phoneDigits(value.phone).length) ||
      value.name.trim().length < 3
    )
      throw new Error("Informe nome e telefone com DDD válidos.");
    if (
      data.customers.some(
        (item) =>
          item.tenantId === value.tenantId &&
          item.id !== value.id &&
          phoneDigits(item.phone) === phoneDigits(value.phone),
      )
    )
      throw new Error("Este telefone já pertence a um cliente da unidade.");
    publish({ ...data, customers: upsert(data.customers, value) });
  },
  async saveService(value) {
    requireOwnerTenant(value.tenantId);
    const data = current();
    publish({ ...data, services: upsert(data.services, value) });
  },
  async saveProfessional(value) {
    requireOwnerTenant(value.tenantId);
    const data = current();
    if (
      value.serviceIds.some(
        (id) =>
          !data.services.some(
            (service) =>
              service.id === id && service.tenantId === value.tenantId,
          ),
      )
    )
      throw new Error("Selecione serviços desta unidade.");
    publish({ ...data, professionals: upsert(data.professionals, value) });
  },
  async saveTenant(value) {
    requireOwnerTenant(value.id);
    const data = current();
    if (value.open >= value.close || !value.weekdays.length)
      throw new Error("Informe uma rotina de funcionamento válida.");
    publish({ ...data, tenants: upsert(data.tenants, value) });
  },
  async saveWaitlist(value) {
    requireOwnerTenant(value.tenantId);
    const data = current();
    if (
      !data.customers.some(
        (item) =>
          item.id === value.customerId && item.tenantId === value.tenantId,
      ) ||
      !data.services.some(
        (item) =>
          item.id === value.serviceId && item.tenantId === value.tenantId,
      )
    )
      throw new Error("Selecione cadastros desta unidade.");
    publish({ ...data, waitlist: upsert(data.waitlist, value) });
  },
  async saveExpense(value) {
    requireOwnerTenant(value.tenantId);
    const data = current();
    publish({ ...data, expenses: upsert(data.expenses, value) });
  },
  async signIn(session) {
    const data = current();
    if (
      !data.tenants.some((item) => item.id === session.tenantId) ||
      (session.role === "staff" &&
        !data.professionals.some(
          (item) =>
            item.id === session.professionalId &&
            item.tenantId === session.tenantId &&
            item.active,
        ))
    )
      throw new Error("Selecione um perfil disponível nesta unidade.");
    publish({ ...data, session });
  },
  async signOut() {
    publish({ ...current(), session: null });
  },
  async reset() {
    requireRole("owner");
    publish({ ...createSeed(todayISO()), session: current().session });
  },
};
