"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  ExternalLink,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Menu,
  Scissors,
  Settings2,
  ShieldCheck,
  Users,
  UsersRound,
  Wallet,
  X,
} from "lucide-react";
import { useState } from "react";
import { Brand, Credit } from "./brand";
import {
  Avatar,
  Badge,
  ButtonLink,
  EmptyState,
  Modal,
  PageSkeleton,
} from "@/components/ui/primitives";
import { useDemo } from "@/lib/data/use-demo";
import { repository } from "@/lib/data/mock-repository";
import { dateLabel, initials, todayISO } from "@/lib/format";

const nav = [
  {
    path: "/app/dashboard",
    label: "Visão geral",
    icon: LayoutDashboard,
    staff: true,
  },
  { path: "/app/agenda", label: "Agenda", icon: CalendarDays, staff: true },
  { path: "/app/clientes", label: "Clientes", icon: Users, staff: false },
  { path: "/app/servicos", label: "Serviços", icon: Scissors, staff: false },
  {
    path: "/app/profissionais",
    label: "Profissionais",
    icon: UsersRound,
    staff: false,
  },
  { path: "/app/financeiro", label: "Financeiro", icon: Wallet, staff: false },
  {
    path: "/app/lista-espera",
    label: "Lista de espera",
    icon: ListOrdered,
    staff: false,
  },
  {
    path: "/app/configuracoes",
    label: "Configurações",
    icon: Settings2,
    staff: false,
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const data = useDemo();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const session = data?.session;
  const staff = session?.role === "staff";
  const tenant = data?.tenants.find((item) => item.id === session?.tenantId);
  const allowed =
    !staff || ["/app/dashboard", "/app/agenda"].includes(pathname);
  async function signOut() {
    await repository.signOut();
    router.push("/login");
  }
  const navigation = (
    <>
      <div className="sidebar-brand">
        <Brand />
        <button
          className="icon-button mobile-menu-toggle"
          onClick={() => setMenuOpen(false)}
          aria-label="Fechar navegação"
        >
          <X size={20} />
        </button>
      </div>
      <div className="tenant-selector">
        <span className="tenant-monogram">
          {tenant ? initials(tenant.name) : "SA"}
        </span>
        <div>
          <span>SEU ESPAÇO</span>
          {staff ? (
            <strong>{tenant?.name}</strong>
          ) : (
            <select
              aria-label="Unidade do painel"
              value={session?.tenantId ?? "studio"}
              onChange={(event) => {
                if (session)
                  void repository.signIn({
                    ...session,
                    tenantId: event.target.value,
                  });
              }}
            >
              {data?.tenants.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          )}
        </div>
        {!staff ? <ChevronDown size={14} /> : null}
      </div>
      <span className="sidebar-label">
        {staff ? "SUA ROTINA" : "GESTÃO DO NEGÓCIO"}
      </span>
      <nav aria-label="Navegação do painel" className="app-nav">
        {nav
          .filter((item) => !staff || item.staff)
          .map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              href={path}
              className={path === pathname ? "active" : ""}
              aria-current={path === pathname ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
            >
              <Icon size={19} strokeWidth={1.7} />
              <span>
                {staff && path === "/app/dashboard" ? "Meu dia" : label}
              </span>
              {path === "/app/lista-espera" ? (
                <span className="nav-counter">
                  {
                    data?.waitlist.filter(
                      (item) =>
                        item.tenantId === session?.tenantId &&
                        item.status === "waiting",
                    ).length
                  }
                </span>
              ) : null}
            </Link>
          ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-demo">
          <span>✦</span>
          <strong>Seu próximo nível.</strong>
          <p>Explore cada parte da sua nova rotina.</p>
          <Link href="/agendar">
            Ver página de agendamento <ArrowUpRight size={15} />
          </Link>
        </div>
        <button className="sidebar-help" onClick={() => setHelpOpen(true)}>
          <CircleHelp size={18} /> Sobre a demonstração{" "}
          <ExternalLink size={13} />
        </button>
        <div className="sidebar-profile">
          <Avatar initials={initials(session?.name ?? "Alex Costa")} small />
          <div>
            <strong>{session?.name}</strong>
            <span>{staff ? "Funcionário(a)" : "Dono(a) do negócio"}</span>
          </div>
          <button
            className="icon-button"
            onClick={() => void signOut()}
            aria-label="Sair da demonstração"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </>
  );
  if (!data)
    return (
      <main id="main">
        <PageSkeleton />
      </main>
    );
  if (!session)
    return (
      <main id="main" className="centered-page">
        <Brand />
        <EmptyState
          title="Seu espaço de gestão está aqui."
          description="Escolha um perfil para explorar o painel demonstrativo do Bookinfy."
          action={<ButtonLink href="/login">Acessar demonstração</ButtonLink>}
        />
        <Credit />
      </main>
    );
  return (
    <div className="app-shell">
      <aside className="app-sidebar">{navigation}</aside>
      <div className="app-workspace">
        <header className="app-header">
          <div>
            <button
              className="icon-button app-mobile-toggle"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir navegação do painel"
            >
              <Menu size={22} />
            </button>
            <span className="breadcrumb">
              Seu espaço <span>/</span>
              <strong>
                {nav.find((item) => item.path === pathname)?.label ?? "Painel"}
              </strong>
            </span>
          </div>
          <div className="app-header-actions">
            <Badge tone="neutral">
              <span className="small-dot" /> Demonstração
            </Badge>
            <Link href="/agendar" className="public-page-link">
              Página de agendamento <ArrowUpRight size={15} />
            </Link>
            <button
              className="notification-button icon-button"
              aria-label="Ver avisos da demonstração"
              onClick={() => setNotificationOpen(true)}
            >
              <Bell size={19} />
              <i />
            </button>
            <Avatar initials={initials(session.name)} small />
          </div>
        </header>
        <div className="app-demo-banner">
          <ShieldCheck size={14} />
          <span>
            Você está em um ambiente demonstrativo, com dados fictícios.
          </span>
          <span className="app-banner-date">
            {dateLabel(todayISO(), {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
        <main id="main" className="app-main">
          {allowed ? (
            children
          ) : (
            <EmptyState
              title="Um espaço reservado à gestão."
              description="O perfil de funcionário tem acesso ao seu dia e à sua agenda individual."
              action={
                <ButtonLink href="/app/agenda">Ir para minha agenda</ButtonLink>
              }
            />
          )}
        </main>
        <footer className="app-footer">
          <Credit />
          <span>
            Feito para o seu próximo passo.{" "}
            <span className="purple-star">✦</span>
          </span>
        </footer>
      </div>
      {menuOpen ? (
        <Modal title="Navegação" onClose={() => setMenuOpen(false)}>
          <div className="mobile-sidebar-content">{navigation}</div>
        </Modal>
      ) : null}
      {notificationOpen ? (
        <Modal
          title="Tudo no seu radar."
          description="Avisos da experiência demonstrativa."
          onClose={() => setNotificationOpen(false)}
        >
          <div className="notification-list">
            <div>
              <CalendarDays size={20} />
              <p>
                <strong>A agenda está conectada.</strong>Os agendamentos criados
                neste navegador aparecem no painel da unidade correspondente.
              </p>
            </div>
            <div>
              <ShieldCheck size={20} />
              <p>
                <strong>Uma prévia da sua rotina.</strong>Login, dados e
                permissões são demonstrativos. A API real será criada na Etapa
                2.
              </p>
            </div>
            <div>
              <ListOrdered size={20} />
              <p>
                <strong>O próximo capítulo vem aí.</strong>WhatsApp e
                recuperação automática de horários estão previstos para a Etapa
                3.
              </p>
            </div>
          </div>
        </Modal>
      ) : null}
      {helpOpen ? (
        <Modal
          title="Conheça a demonstração"
          onClose={() => setHelpOpen(false)}
        >
          <div className="help-content">
            <p>
              Explore o painel com perfis de dono ou funcionário. Cadastros e
              agendamentos são fictícios e salvos somente neste navegador.
            </p>
            <p>
              Para começar de novo, use “Restaurar demonstração” nas
              configurações do dono.
            </p>
            <p>Nenhum pagamento, mensagem ou e-mail é enviado.</p>
            <ButtonLink href="/como-funciona" variant="secondary">
              Conhecer a jornada
            </ButtonLink>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
