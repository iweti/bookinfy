import { liveMode } from "@/lib/bookinfy/mode";
import { redirect } from "next/navigation";
import { Dashboard } from "@/features/dashboard/dashboard";
export default function DashboardPage() {
  if (liveMode) redirect("/app/agenda");
  return <Dashboard />;
}
