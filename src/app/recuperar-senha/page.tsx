import { liveMode } from "@/lib/bookinfy/mode";
import { redirect } from "next/navigation";
import { AuthScreen } from "@/features/auth/auth-screen";
export const metadata = { title: "Recuperar acesso" };
export default function Recover() {
  if (liveMode) redirect("/login");
  return <AuthScreen mode="recover" />;
}
