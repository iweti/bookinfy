import { liveMode } from "@/lib/bookinfy/mode";
import { redirect } from "next/navigation";
export default function Panel() {
  redirect(liveMode ? "/app/agenda" : "/app/dashboard");
}
