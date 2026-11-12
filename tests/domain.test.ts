import test from "node:test";
import assert from "node:assert/strict";
import {
  availableSlots,
  overlaps,
  validateBooking,
} from "../src/lib/scheduling.ts";
import { createSeed } from "../src/mocks/seed.ts";
import type { Appointment, BookingDraft } from "../src/types/domain.ts";

const now = new Date("2026-11-05T10:00:00Z");
const seed = createSeed("2026-11-05");
const tenant = seed.tenants[0];
const service = seed.services.find((item) => item.id === "combo")!;
const appointment: Appointment = {
  id: "test",
  tenantId: tenant.id,
  professionalId: "leo",
  customerId: "c1",
  serviceId: service.id,
  date: "2026-11-06",
  time: "10:00",
  duration: 60,
  price: 85,
  status: "confirmed",
  source: "online",
  recovered: false,
};
const draft: BookingDraft = {
  tenantId: "studio",
  serviceId: "combo",
  professionalId: "leo",
  date: "2026-11-06",
  time: "17:00",
  customer: {
    name: "Pessoa de Teste",
    phone: "11900000999",
    email: "teste@example.com",
  },
};

test("intervalos contíguos são aceitos e sobreposições parciais são bloqueadas", () => {
  assert.equal(overlaps("09:00", 60, appointment), false);
  assert.equal(overlaps("09:30", 60, appointment), true);
  assert.equal(overlaps("10:30", 30, appointment), true);
  assert.equal(overlaps("11:00", 30, appointment), false);
});
test("duração completa precisa caber no expediente", () => {
  const slots = availableSlots(tenant, service, "leo", "2026-11-06", [], now);
  assert.ok(slots.includes("18:00"));
  assert.ok(!slots.includes("18:30"));
  assert.ok(!slots.includes("08:30"));
});
test("horários ocupados bloqueiam todo o intervalo do atendimento", () => {
  const slots = availableSlots(
    tenant,
    service,
    "leo",
    "2026-11-06",
    [appointment],
    now,
  );
  assert.ok(!slots.includes("09:30"));
  assert.ok(!slots.includes("10:00"));
  assert.ok(!slots.includes("10:30"));
  assert.ok(slots.includes("11:00"));
});
test("cancelamentos liberam horários; outras unidades e profissionais não bloqueiam", () => {
  for (const other of [
    { ...appointment, status: "canceled" as const },
    { ...appointment, status: "no_show" as const },
    { ...appointment, tenantId: "jardins" },
    { ...appointment, professionalId: "bia" },
  ])
    assert.ok(
      availableSlots(
        tenant,
        service,
        "leo",
        "2026-11-06",
        [other],
        now,
      ).includes("10:00"),
    );
});
test("dias fechados e datas passadas não oferecem horários", () => {
  assert.deepEqual(
    availableSlots(tenant, service, "leo", "2027-02-30", [], now),
    [],
  );
  assert.deepEqual(
    availableSlots(tenant, service, "leo", "2026-11-08", [], now),
    [],
  );
  assert.deepEqual(
    availableSlots(tenant, service, "leo", "2026-11-04", [], now),
    [],
  );
});
test("disponibilidade no mesmo dia respeita o horário de São Paulo", () => {
  assert.equal(
    availableSlots(
      tenant,
      service,
      "leo",
      "2026-11-05",
      [],
      new Date("2026-11-05T13:15:00Z"),
    )[0],
    "10:30",
  );
});
test("confirmação rejeita serviços e profissionais de outra unidade", () => {
  assert.equal(validateBooking(seed, draft, now), null);
  assert.match(
    validateBooking(seed, { ...draft, professionalId: "ana" }, now)!,
    /unidade/,
  );
  assert.match(
    validateBooking(seed, { ...draft, serviceId: "hair" }, now)!,
    /unidade/,
  );
});
test("confirmação revalida telefone, e-mail e conflitos", () => {
  assert.match(
    validateBooking(
      seed,
      { ...draft, customer: { ...draft.customer, phone: "123" } },
      now,
    )!,
    /telefone/,
  );
  assert.match(
    validateBooking(
      seed,
      { ...draft, customer: { ...draft.customer, email: "sem-email" } },
      now,
    )!,
    /e-mail/,
  );
  assert.match(
    validateBooking(
      { ...seed, appointments: [appointment] },
      { ...draft, time: "10:30" },
      now,
    )!,
    /disponível/,
  );
});
test("fixtures preservam relações e não criam conflitos ativos", () => {
  for (const item of seed.appointments) {
    const professional = seed.professionals.find(
      (value) => value.id === item.professionalId,
    )!;
    assert.equal(professional.tenantId, item.tenantId);
    assert.ok(professional.serviceIds.includes(item.serviceId));
    assert.ok(
      seed.customers.some(
        (value) =>
          value.id === item.customerId && value.tenantId === item.tenantId,
      ),
    );
    if (["canceled", "no_show"].includes(item.status)) continue;
    const other = seed.appointments.filter(
      (value) =>
        value.id !== item.id &&
        value.tenantId === item.tenantId &&
        value.professionalId === item.professionalId &&
        value.date === item.date &&
        !["canceled", "no_show"].includes(value.status),
    );
    assert.ok(
      !other.some((value) => overlaps(item.time, item.duration, value)),
    );
  }
});
