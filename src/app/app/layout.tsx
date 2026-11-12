import { AppShell } from "@/components/layout/app-shell";
export const metadata = { title: "Painel de gestão" };
export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
