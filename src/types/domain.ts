export type Role = "owner" | "staff";
export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "canceled"
  | "no_show";

export interface Tenant {
  id: string;
  name: string;
  segment: string;
  address: string;
  city: string;
  phone: string;
  open: string;
  close: string;
  weekdays: number[];
}

export interface Service {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  category: string;
  duration: number;
  price: number;
  active: boolean;
}

export interface Professional {
  id: string;
  tenantId: string;
  name: string;
  specialty: string;
  initials: string;
  color: "purple" | "peach" | "blue";
  serviceIds: string[];
  active: boolean;
}

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
}

export interface Appointment {
  id: string;
  tenantId: string;
  customerId: string;
  serviceId: string;
  professionalId: string;
  date: string;
  time: string;
  duration: number;
  price: number;
  status: AppointmentStatus;
  source: "online" | "manual";
  recovered: boolean;
}

export interface WaitlistEntry {
  id: string;
  tenantId: string;
  customerId: string;
  serviceId: string;
  professionalId: string;
  date: string;
  preference: "any" | "morning" | "afternoon";
  status: "waiting" | "contacted" | "fulfilled";
}

export interface Expense {
  id: string;
  tenantId: string;
  title: string;
  category: string;
  amount: number;
  date: string;
}

export interface DemoSession {
  role: Role;
  name: string;
  professionalId: string;
  tenantId: string;
}

export interface DemoData {
  version: 1;
  referenceDate: string;
  tenants: Tenant[];
  services: Service[];
  professionals: Professional[];
  customers: Customer[];
  appointments: Appointment[];
  waitlist: WaitlistEntry[];
  expenses: Expense[];
  session: DemoSession | null;
  lastBookingId: string | null;
}

export interface BookingDraft {
  tenantId: string;
  serviceId: string;
  professionalId: string;
  date: string;
  time: string;
  customer: Pick<Customer, "name" | "phone" | "email">;
}

export interface BookingResult {
  appointment?: Appointment;
  error?: string;
}
