import { liveMode } from "@/lib/bookinfy/mode";
import { OwnerPanel } from "@/features/owner/owner-panel";
import { AppShell } from "@/components/layout/app-shell";
export const metadata = { title: "Painel de gestão" };
export default function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return liveMode ? (
    <OwnerPanel>{children}</OwnerPanel>
  ) : (
    <AppShell>{children}</AppShell>
  );
}
