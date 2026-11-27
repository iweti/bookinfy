"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Brand, Credit } from "./brand";
import { liveMode } from "@/lib/bookinfy/mode";
import { ButtonLink } from "@/components/ui/primitives";

const links = [
  { href: "/#negocios", label: "Seu negócio" },
  { href: "/solucoes", label: "Soluções" },
  { href: "/como-funciona", label: "Como funciona" },
  { href: "/planos", label: "Planos" },
  { href: "/#duvidas", label: "Dúvidas" },
];

export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);
  return (
    <header className="marketing-header">
      <div className="container header-inner">
        <Brand />
        <nav className="desktop-nav" aria-label="Navegação principal">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname === link.href ? "active" : ""}
              aria-current={pathname === link.href ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <Link href="/login" className="login-link">
            Entrar <ArrowUpRight size={15} />
          </Link>
          <ButtonLink
            href={liveMode ? "/login" : "/cadastro"}
            className="header-cta"
          >
            {liveMode ? "Acessar painel" : "Conhecer o Bookinfy"}
          </ButtonLink>
          <button
            className="icon-button mobile-menu-toggle"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open ? (
        <nav
          id="mobile-nav"
          className="mobile-nav"
          aria-label="Navegação móvel"
        >
          {links.map((link) => (
            <Link
              href={link.href}
              key={link.href}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={liveMode ? "/login" : "/cadastro"}
            onClick={() => setOpen(false)}
          >
            {liveMode ? "Acessar painel" : "Conhecer a demonstração"}
          </Link>
        </nav>
      ) : null}
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="marketing-footer">
      <div className="container footer-main">
        <div>
          <Brand />
          <p>
            Mais tempo para cuidar.
            <br />
            Mais espaço para crescer.
          </p>
          {liveMode ? null : (
            <span className="footer-demo">MVP visual · Etapa 1</span>
          )}
        </div>
        <div>
          <h3>Explore</h3>
          <Link href="/solucoes">Soluções</Link>
          <Link href="/como-funciona">Como funciona</Link>
          <Link href="/planos">Planos</Link>
        </div>
        <div>
          <h3>Experimente</h3>
          <Link href="/agendar">Agendamento online</Link>
          <Link href="/login">Painel de gestão</Link>
          {liveMode ? null : (
            <Link href="/cadastro">Criar conta demonstrativa</Link>
          )}
        </div>
        <div className="footer-note">
          <span className="small-dot" /> Feito para sua próxima fase.
          <p>Uma experiência de gestão para quem cuida de pessoas.</p>
        </div>
      </div>
      <div className="container footer-bottom">
        <Credit />
        {liveMode ? null : <span>Conteúdo e dados de demonstração.</span>}
      </div>
    </footer>
  );
}
