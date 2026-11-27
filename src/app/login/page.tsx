import { liveMode } from "@/lib/bookinfy/mode";
import { OwnerLogin } from "@/features/auth/owner-login";
import { AuthScreen } from "@/features/auth/auth-screen";
export const metadata = { title: "Entrar" };
export default function Login() {
  return liveMode ? <OwnerLogin /> : <AuthScreen mode="login" />;
}
