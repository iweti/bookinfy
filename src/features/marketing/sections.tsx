import { liveMode } from "@/lib/bookinfy/mode";
import {
  ArrowDown,
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronRight,
  CircleCheck,
  Clock3,
  Heart,
  LayoutDashboard,
  MessageCircle,
  Scissors,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { Avatar, Badge, ButtonLink } from "@/components/ui/primitives";
import Link from "next/link";

export function ProductPreview({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`product-preview ${compact ? "product-preview-compact" : ""}`}
      aria-label="Prévia ilustrativa da agenda Bookinfy"
    >
      <div className="preview-toolbar">
        <span className="preview-dots">
          <i />
          <i />
          <i />
        </span>
        <span>Seu negócio, em sintonia.</span>
        <ShieldCheck size={14} />
      </div>
      <div className="preview-body">
        <aside className="preview-sidebar">
          <span className="preview-logo">
            <Check strokeWidth={4} /> b.
          </span>
          {[LayoutDashboard, CalendarDays, Users, Wallet].map((Icon, i) => (
            <span key={i} className={i === 1 ? "selected" : ""}>
              <Icon size={18} />
            </span>
          ))}
          <span className="preview-sidebar-bottom">
            <Avatar initials="AC" small />
          </span>
        </aside>
        <div className="preview-content">
          <div className="preview-title">
            <div>
              <span className="preview-eyebrow">TUDO NO SEU TEMPO</span>
              <h3>
                Sua agenda, organizada <span>✦</span>
              </h3>
            </div>
            <span className="preview-add">+ Novo</span>
          </div>
          <div className="preview-summary">
            <div>
              <span>Hoje na agenda</span>
              <strong>
                08 <small>atendimentos</small>
              </strong>
            </div>
            <div>
              <span>Receita prevista</span>
              <strong>
                R$ 475<small className="text-green"> · exemplo</small>
              </strong>
            </div>
          </div>
          <div className="preview-week">
            <strong>
              Quinta-feira <small>· sua semana flui melhor</small>
            </strong>
            <span>
              Dia <span className="text-muted">Semana</span>
            </span>
          </div>
          <div className="preview-columns">
            <span>Horário</span>
            <span>
              <i className="professional-dot" /> Leonardo
            </span>
            <span>
              <i className="professional-dot peach" /> Beatriz
            </span>
          </div>
          <div className="preview-calendar">
            <span className="preview-time">09:00</span>
            <div className="preview-appointment purple">
              <strong>Lucas Martins</strong>
              <span>Corte de cabelo · 30 min</span>
              <small>
                <i /> Confirmado
              </small>
            </div>
            <div className="preview-appointment peach">
              <strong>Mariana Santos</strong>
              <span>Corte + barba · 60 min</span>
              <small>
                <i /> Confirmado
              </small>
            </div>
            <span className="preview-time">09:30</span>
            <div className="preview-free">
              <span>Seu próximo cliente pode estar aqui.</span>
            </div>
            <span />
            <span className="preview-time">10:00</span>
            <div className="preview-appointment blue">
              <strong>Gabriel Rocha</strong>
              <span>Barba & cuidado · 30 min</span>
              <small>
                <i /> Agendado
              </small>
            </div>
            <div className="preview-free">
              <span>Horário livre</span>
            </div>
          </div>
          <div className="preview-foot">
            <span className="small-dot" /> Uma rotina mais leve começa com
            organização.
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-copy">
          <span className="hero-pill">
            <span className="small-dot" /> SEU NEGÓCIO ONLINE. SUA ROTINA MAIS
            LEVE.
          </span>
          <h1>
            Sua rotina
            <br />
            mais simples.
            <br />
            <em>
              Seu negócio
              <br />
              mais forte.
            </em>
          </h1>
          <p>
            Agendamentos, clientes, equipe e financeiro.
            <br className="desktop-break" /> Tudo no mesmo lugar, com mais tempo
            para o que importa: <strong>cuidar de quem chega.</strong>
          </p>
          <div className="hero-actions">
            <ButtonLink href={liveMode ? "/login" : "/cadastro"} arrow>
              {liveMode ? "Acessar painel" : "Conhecer o Bookinfy"}
            </ButtonLink>
            <ButtonLink href="/agendar" variant="secondary">
              Ver um agendamento <ArrowUpRight size={17} />
            </ButtonLink>
          </div>
          <div className="hero-reassurance">
            <span>
              <Check size={15} /> Simples para sua equipe
            </span>
            <span>
              <Check size={15} /> Fácil para seus clientes
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-orbit orbit-one" />
          <div className="hero-orbit orbit-two" />
          <div className="hero-floating-label">
            <span className="icon-circle">
              <CalendarDays size={19} />
            </span>
            <div>
              <strong>Seu próximo capítulo.</strong>
              <span>Mais organização, novas possibilidades.</span>
            </div>
            <Sparkles size={18} />
          </div>
          <ProductPreview />
          <div className="hero-floating-success">
            <span className="success-check">
              <CheckCheck size={21} />
            </span>
            <div>
              <strong>Um horário livre. Uma nova chance.</strong>
              <span>Lista de espera pensada para sua agenda.</span>
            </div>
            <span className="tiny-tag">EM BREVE</span>
          </div>
          <p className="visual-caption">
            PRÉVIA DO PRODUTO · DADOS ILUSTRATIVOS
          </p>
        </div>
      </div>
      <div className="container hero-bottom">
        <a href="#solucoes">
          <span>Conheça uma nova forma de gerir</span>
          <ArrowDown size={16} />
        </a>
        <span>DO PRIMEIRO AGENDAMENTO AO PRÓXIMO CRESCIMENTO.</span>
      </div>
    </section>
  );
}

export function BusinessStrip() {
  return (
    <section className="business-strip" id="negocios">
      <div className="container">
        <p>
          Para quem transforma
          <br />
          <strong>cuidado em negócio.</strong>
        </p>
        <div>
          {[
            { icon: Scissors, title: "Barbearias" },
            { icon: Sparkles, title: "Salões de beleza" },
            { icon: Heart, title: "Clínicas de estética" },
            { icon: Users, title: "Seu próximo negócio" },
          ].map(({ icon: Icon, title }) => (
            <span key={title}>
              <Icon size={22} strokeWidth={1.5} />
              {title}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    icon: CalendarDays,
    title: "Sua agenda trabalha com você.",
    description:
      "Serviços, profissionais e horários disponíveis em um fluxo simples para o seu cliente.",
    tag: "AGENDAMENTO ONLINE",
    color: "purple",
  },
  {
    icon: Wallet,
    title: "Clareza para o próximo passo.",
    description:
      "Receita prevista, atendimentos e uma visão financeira para acompanhar a rotina.",
    tag: "VISÃO DO NEGÓCIO",
    color: "green",
  },
  {
    icon: Users,
    title: "Cada pessoa no seu lugar.",
    description:
      "Uma visão completa para o dono e uma agenda objetiva para quem atende.",
    tag: "DONO & EQUIPE",
    color: "peach",
  },
];

export function Features() {
  return (
    <section className="section features-section" id="solucoes">
      <div className="container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">MENOS COMPLICAÇÃO. MAIS POSSIBILIDADES.</p>
            <h2>
              Seu dia tem muita coisa.
              <br />
              <em>Sua gestão pode ser simples.</em>
            </h2>
          </div>
          <p>
            Do horário marcado à visão do mês,
            <br />o Bookinfy conecta as partes da sua rotina.
          </p>
        </div>
        <div className="feature-grid">
          {features.map(
            ({ icon: Icon, title, description, tag, color }, index) => (
              <article className={`feature-card feature-${color}`} key={title}>
                <span className="feature-number">0{index + 1}</span>
                <span className={`feature-icon ${color}`}>
                  <Icon size={28} strokeWidth={1.6} />
                </span>
                <p className="eyebrow">{tag}</p>
                <h3>{title}</h3>
                <p>{description}</p>
                <Link href={index === 0 ? "/agendar" : "/login"}>
                  {liveMode
                    ? index === 0
                      ? "Abrir agendamento"
                      : "Acessar painel"
                    : "Explorar na demonstração"}{" "}
                  <ArrowUpRight size={17} />
                </Link>
              </article>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

export function Workflow() {
  return (
    <section className="section workflow-section" id="como-funciona">
      <div className="container workflow-grid">
        <div>
          <p className="eyebrow">UM FLUXO QUE FAZ SENTIDO</p>
          <h2>
            O cliente agenda.
            <br />
            Você se organiza.
            <br />
            <em>Todo mundo ganha tempo.</em>
          </h2>
          <p className="section-description">
            Sem ir e voltar entre conversas e anotações. Um caminho claro, do
            primeiro clique ao atendimento.
          </p>
          <ButtonLink href="/agendar" variant="secondary" arrow>
            Experimentar o agendamento
          </ButtonLink>
          {liveMode ? null : (
            <div className="workflow-note">
              <ShieldCheck size={17} /> Você está explorando uma demonstração
              visual.
            </div>
          )}
        </div>
        <div className="workflow-steps">
          {[
            {
              title: "Um link. Muitas possibilidades.",
              text: "O cliente encontra a unidade, escolhe o serviço e o profissional.",
              icon: Scissors,
            },
            {
              title: "O melhor horário para cada pessoa.",
              text: "Datas e horários organizados, com um resumo antes de confirmar.",
              icon: Clock3,
            },
            {
              title: "Tudo pronto para receber bem.",
              text: "O agendamento aparece na agenda e na visão da sua equipe.",
              icon: CircleCheck,
            },
          ].map(({ title, text, icon: Icon }, i) => (
            <article className="workflow-step" key={title}>
              <span className="step-index">0{i + 1}</span>
              <div>
                <span className="step-icon">
                  <Icon size={21} />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Growth() {
  return (
    <section className="section growth-section">
      <div className="container growth-grid">
        <div className="growth-art">
          <div className="growth-mini-header">
            <span>
              <TrendingUp size={18} /> Visão do negócio
            </span>
            <Badge tone="green">Dados de exemplo</Badge>
          </div>
          <div className="growth-amount">
            <span>Receita dos atendimentos</span>
            <strong>
              R$ 4.820<span>,00</span>
            </strong>
          </div>
          <div
            className="growth-chart"
            role="img"
            aria-label="Gráfico ilustrativo de receita semanal"
          >
            {[30, 46, 38, 65, 52, 81, 70, 96, 77, 88, 100, 91].map(
              (height, i) => (
                <div key={i}>
                  <i style={{ height: `${height}%` }} />
                </div>
              ),
            )}
          </div>
          <div className="growth-months">
            <span>Organizar</span>
            <span>Acompanhar</span>
            <strong>Crescer ↗</strong>
          </div>
          <div className="growth-message">
            <span>
              <MessageCircle size={19} />
            </span>
            <div>
              <strong>Um cuidado que continua.</strong>
              <p>Lembretes e novas oportunidades na evolução do produto.</p>
            </div>
            <Badge>Próxima etapa</Badge>
          </div>
        </div>
        <div>
          <p className="eyebrow">ALÉM DO HORÁRIO MARCADO</p>
          <h2>
            Uma agenda cheia
            <br />é boa.
            <br />
            <em>
              Uma gestão clara
              <br />é melhor ainda.
            </em>
          </h2>
          <p className="section-description">
            Entenda sua operação hoje e conheça o que estamos preparando para os
            próximos passos.
          </p>
          <ul className="check-list">
            <li>
              <Check size={18} /> Indicadores de agendamentos e ocupação
            </li>
            <li>
              <Check size={18} /> Clientes, serviços e equipe organizados
            </li>
            <li>
              <Check size={18} /> Lista de espera para visualizar oportunidades
            </li>
          </ul>
          <div className="roadmap-callout">
            <Sparkles size={19} />
            <p>
              <strong>No horizonte:</strong> lembretes por WhatsApp, recuperação
              automática de horários e fidelização. Recursos previstos para as
              próximas etapas.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Plans() {
  return (
    <section className="section plans-section" id="planos">
      <div className="container">
        <div className="section-heading centered">
          <p className="eyebrow">SEU PRÓXIMO PASSO COMEÇA AQUI</p>
          <h2>
            Conheça o que faz parte
            <br />
            <em>de uma rotina mais leve.</em>
          </h2>
          <p>
            {liveMode
              ? "O agendamento online e a agenda do dono já estão disponíveis."
              : "Explore os recursos do Bookinfy em uma demonstração navegável."}
          </p>
        </div>
        <div className="plan-panel">
          <div className="plan-intro">
            <span className="plan-icon">
              <CheckCheck size={27} />
            </span>
            <Badge>BOOKINFY · VISÃO DO PRODUTO</Badge>
            <h3>
              Espaço para
              <br />o seu negócio crescer.
            </h3>
            <p>
              Gestão do cuidado, do primeiro agendamento à visão do negócio.
            </p>
            <ButtonLink href={liveMode ? "/login" : "/cadastro"} arrow>
              {liveMode ? "Acessar painel" : "Explorar a demonstração"}
            </ButtonLink>
            <small>
              Apresentação de recursos. Sem contratação nesta etapa.
            </small>
          </div>
          <div className="plan-features">
            <p className="eyebrow">CONHEÇA NA ETAPA VISUAL</p>
            <ul>
              {[
                "Página de agendamento para seus clientes",
                "Agenda organizada por profissional",
                "Dashboard do dono e visão da equipe",
                "Cadastro de clientes, serviços e profissionais",
                "Visão financeira com dados demonstrativos",
                "Painel visual da lista de espera",
              ].map((text) => (
                <li key={text}>
                  <CircleCheck size={18} />
                  {text}
                </li>
              ))}
            </ul>
            <div className="plan-next">
              <span>EM EVOLUÇÃO</span>
              <p>
                Integrações, automações e regras operacionais reais serão
                adicionadas nas próximas etapas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FAQ() {
  const questions = [
    [
      "Para quais negócios o Bookinfy está sendo pensado?",
      "Barbearias, salões de beleza, clínicas de estética e outros negócios que trabalham com atendimentos agendados.",
    ],
    [
      "Posso experimentar o fluxo de agendamento?",
      liveMode
        ? "Sim. Escolha um estabelecimento, serviço, profissional e horário para reservar."
        : "Sim. A demonstração permite escolher unidade, serviço, profissional, data e horário. Use dados fictícios: os agendamentos são demonstrativos e ficam apenas neste navegador.",
    ],
    [
      "Minha equipe terá uma visão própria?",
      liveMode
        ? "A agenda está disponível para o dono. A visão individual dos funcionários está prevista para a etapa de gestão."
        : "Sim. Na tela de acesso, escolha o perfil de funcionário para conhecer a agenda individual e os status dos atendimentos.",
    ],
    [
      "Os lembretes por WhatsApp já estão disponíveis?",
      "Ainda não. O envio de mensagens, a recuperação automática de horários e as demais automações estão previstos para uma etapa futura.",
    ],
    [
      "Como conhecer os planos e os valores?",
      "Esta etapa apresenta os recursos do produto. Preços, condições comerciais e contratação ainda serão definidos.",
    ],
  ];
  return (
    <section className="section faq-section" id="duvidas">
      <div className="container faq-grid">
        <div>
          <p className="eyebrow">PODE CHEGAR, A GENTE EXPLICA.</p>
          <h2>
            Antes do próximo
            <br />
            <em>passo, suas dúvidas.</em>
          </h2>
          <p className="section-description">
            Um pouco mais sobre a experiência
            <br />
            que estamos construindo.
          </p>
        </div>
        <div className="faq-list">
          {questions.map(([question, answer], i) => (
            <details key={question} open={i === 0}>
              <summary>
                {question}
                <span>+</span>
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCTA() {
  return (
    <section className="final-cta">
      <div className="container">
        <div>
          <p className="eyebrow">O PRÓXIMO NÍVEL COMEÇA COM UM PASSO.</p>
          <h2>
            Seu tempo vale mais.
            <br />
            <span>Seu negócio também.</span>
          </h2>
        </div>
        <div>
          <ButtonLink
            href={liveMode ? "/login" : "/cadastro"}
            className="button-white"
            arrow
          >
            {liveMode ? "Acessar painel" : "Conhecer o Bookinfy"}
          </ButtonLink>
          <Link href="/agendar">
            Ou veja como seu cliente agenda <ChevronRight size={16} />
          </Link>
        </div>
        <span className="cta-star" aria-hidden="true">
          ✦
        </span>
      </div>
    </section>
  );
}

export function SubpageHero({
  eyebrow,
  title,
  accent,
  description,
}: {
  eyebrow: string;
  title: string;
  accent: string;
  description: string;
}) {
  return (
    <section className="subpage-hero">
      <div className="container">
        <p className="eyebrow">{eyebrow}</p>
        <h1>
          {title}
          <br />
          <em>{accent}</em>
        </h1>
        <p>{description}</p>
        <ButtonLink href="/agendar" arrow>
          Conhecer a experiência
        </ButtonLink>
      </div>
    </section>
  );
}
