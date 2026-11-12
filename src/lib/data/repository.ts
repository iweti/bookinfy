import type {
  Appointment,
  AppointmentStatus,
  BookingDraft,
  BookingResult,
  Customer,
  DemoData,
  DemoSession,
  Expense,
  Professional,
  Service,
  Tenant,
  WaitlistEntry,
} from "@/types/domain";

/** Boundary for a future Go adapter. Phase 1 implements these operations locally. */
export interface BookingRepository {
  createBooking(
    draft: BookingDraft,
    source?: "online" | "manual",
  ): Promise<BookingResult>;
  updateAppointment(id: string, status: AppointmentStatus): Promise<void>;
  rescheduleAppointment(id: string, date: string, time: string): Promise<void>;
  saveCustomer(customer: Customer): Promise<void>;
  saveService(service: Service): Promise<void>;
  saveProfessional(professional: Professional): Promise<void>;
  saveTenant(tenant: Tenant): Promise<void>;
  saveWaitlist(entry: WaitlistEntry): Promise<void>;
  saveExpense(expense: Expense): Promise<void>;
  signIn(session: DemoSession): Promise<void>;
  signOut(): Promise<void>;
  reset(): Promise<void>;
}

export type DemoSnapshot = DemoData | null;
export type AppointmentWithDetails = Appointment & {
  customer?: Customer;
  service?: Service;
  professional?: Professional;
};
