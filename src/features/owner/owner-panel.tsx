"use client";

import { usePathname } from "next/navigation";
import { Brand } from "@/components/layout/brand";
import { ButtonLink, EmptyState } from "@/components/ui/primitives";
import type { ReactNode } from "react";

export function OwnerPanel({ children }: { children: ReactNode }) {
  const path = usePathname();
  if (path === "/app/agenda" || path === "/app" || path === "/app/dashboard")
    return children;

  return (
    <>
      <header className="booking-header container">
        <Brand />
      </header>
      <main id="main" className="booking-main container">
        <EmptyState
          title="Módulo indisponível"
          description="Os agendamentos deste estabelecimento estão disponíveis na agenda."
          action={<ButtonLink href="/app/agenda">Abrir agenda</ButtonLink>}
        />
      </main>
    </>
  );
}
