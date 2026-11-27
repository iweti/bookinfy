import { liveMode } from "@/lib/bookinfy/mode";
import { OwnerAgenda } from "@/features/owner/owner-agenda";
import { Agenda } from "@/features/management/agenda";
export default function AgendaPage() {
  return liveMode ? <OwnerAgenda /> : <Agenda />;
}
