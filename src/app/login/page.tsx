import { AuthScreen } from "@/features/auth/auth-screen";
export const metadata = { title: "Entrar" };
export default function Login() {
  return <AuthScreen mode="login" />;
}
