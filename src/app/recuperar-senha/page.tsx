import { AuthScreen } from "@/features/auth/auth-screen";
export const metadata = { title: "Recuperar acesso" };
export default function Recover() {
  return <AuthScreen mode="recover" />;
}
