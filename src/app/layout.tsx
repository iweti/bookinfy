import type { Metadata } from "next";
import { ToastProvider } from "@/components/ui/primitives";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Bookinfy — Sua rotina mais simples. Seu negócio mais forte.",
    template: "%s · Bookinfy",
  },
  description:
    "Agendamento online e gestão em um só lugar. Conheça o MVP visual do Bookinfy para barbearias, salões e negócios de cuidado.",
  robots: { index: false, follow: false },
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth">
      <body>
        <a href="#main" className="skip-link">
          Pular para o conteúdo
        </a>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
