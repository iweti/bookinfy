import { liveMode } from "@/lib/bookinfy/mode";
import { redirect } from "next/navigation";
import { AuthScreen } from "@/features/auth/auth-screen";
export const metadata = { title: "Conheça o Bookinfy" };
export default function Register() {
  if (liveMode) redirect("/login");
  return <AuthScreen mode="register" />;
}
