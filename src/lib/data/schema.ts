import { z } from "zod";
import type { DemoData } from "@/types/domain";

const id = z.string().min(1);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const demoDataSchema: z.ZodType<DemoData> = z.object({
  version: z.literal(1),
  referenceDate: date,
  tenants: z
    .array(
      z.object({
        id,
        name: id,
        segment: z.string(),
        address: z.string(),
        city: z.string(),
        phone: z.string(),
        open: time,
        close: time,
        weekdays: z.array(z.number().int().min(0).max(6)),
      }),
    )
    .min(1),
  services: z.array(
    z.object({
      id,
      tenantId: id,
      name: id,
      description: z.string(),
      category: z.string(),
      duration: z.number().int().min(15).max(480),
      price: z.number().min(0),
      active: z.boolean(),
    }),
  ),
  professionals: z.array(
    z.object({
      id,
      tenantId: id,
      name: id,
      specialty: z.string(),
      initials: z.string(),
      color: z.enum(["purple", "peach", "blue"]),
      serviceIds: z.array(id),
      active: z.boolean(),
    }),
  ),
  customers: z.array(
    z.object({
      id,
      tenantId: id,
      name: id,
      phone: z.string(),
      email: z.string(),
      notes: z.string(),
    }),
  ),
  appointments: z.array(
    z.object({
      id,
      tenantId: id,
      customerId: id,
      serviceId: id,
      professionalId: id,
      date,
      time,
      duration: z.number().positive(),
      price: z.number().min(0),
      status: z.enum([
        "scheduled",
        "confirmed",
        "in_progress",
        "completed",
        "canceled",
        "no_show",
      ]),
      source: z.enum(["online", "manual"]),
      recovered: z.boolean(),
    }),
  ),
  waitlist: z.array(
    z.object({
      id,
      tenantId: id,
      customerId: id,
      serviceId: id,
      professionalId: z.string(),
      date,
      preference: z.enum(["any", "morning", "afternoon"]),
      status: z.enum(["waiting", "contacted", "fulfilled"]),
    }),
  ),
  expenses: z.array(
    z.object({
      id,
      tenantId: id,
      title: id,
      category: z.string(),
      amount: z.number().positive(),
      date,
    }),
  ),
  session: z
    .object({
      role: z.enum(["owner", "staff"]),
      name: id,
      professionalId: z.string(),
      tenantId: id,
    })
    .nullable(),
  lastBookingId: z.string().nullable(),
});
