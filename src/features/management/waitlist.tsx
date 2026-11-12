"use client";

import {
  ArrowRight,
  Check,
  Clock3,
  ListOrdered,
  MessageCircle,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import {
  Avatar,
  Badge,
  Button,
  ButtonLink,
  EmptyState,
  Field,
  InlineError,
  Modal,
  PageHeading,
  PageSkeleton,
  useToast,
} from "@/components/ui/primitives";
import { useDemo } from "@/lib/data/use-demo";
import { newId, repository } from "@/lib/data/mock-repository";
import { addDays, dateLabel, initials, todayISO } from "@/lib/format";
import type { DemoData, WaitlistEntry } from "@/types/domain";

export function Waitlist() {
  const data = useDemo();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const toast = useToast();
  if (!data?.session) return <PageSkeleton />;
  const entries = data.waitlist.filter(
    (item) => item.tenantId === data.session?.tenantId,
  );
  const filtered = entries.filter(
    (item) =>
      (filter === "all" || item.status === filter) &&
      (
        data.customers.find((customer) => customer.id === item.customerId)
          ?.name ?? ""
      )
        .toLocaleLowerCase("pt-BR")
        .includes(search.toLocaleLowerCase("pt-BR")),
  );
  async function changeStatus(
    entry: WaitlistEntry,
    status: WaitlistEntry["status"],
  ) {
    try {
      await repository.saveWaitlist({ ...entry, status });
      toast(
        status === "contacted"
          ? "Oferta simulada. Nenhuma mensagem foi enviada ao cliente."
          : "Interesse encerrado na demonstração. Nenhum agendamento foi criado.",
      );
    } catch (err) {
      toast(err instanceof Error ? err.message : "Não foi possível atualizar.");
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="UMA VAGA. UMA NOVA POSSIBILIDADE."
        title="Seu próximo encontro pode estar aqui."
        description="Organize os interesses dos clientes e visualize novas oportunidades."
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={17} /> Adicionar interesse
          </Button>
        }
      />
      <div className="waitlist-stats">
        <div>
          <span className="metric-icon purple">
            <ListOrdered size={20} />
          </span>
          <span>
            <strong>
              {entries.filter((item) => item.status === "waiting").length}
            </strong>{" "}
            aguardando um horário
          </span>
        </div>
        <div>
          <span className="metric-icon blue">
            <MessageCircle size={20} />
          </span>
          <span>
            <strong>
              {entries.filter((item) => item.status === "contacted").length}
            </strong>{" "}
            ofertas simuladas
          </span>
        </div>
        <div>
          <span className="metric-icon green">
            <Check size={20} />
          </span>
          <span>
            <strong>
              {entries.filter((item) => item.status === "fulfilled").length}
            </strong>{" "}
            interesses encerrados
          </span>
        </div>
      </div>
      <div className="waitlist-layout">
        <section className="panel">
          <div className="table-toolbar">
            <label className="search-field">
              <Search size={17} />
              <input
                aria-label="Buscar na lista de espera"
                placeholder="Buscar cliente..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <select
              aria-label="Filtrar lista de espera"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="all">Todos os interesses</option>
              <option value="waiting">Aguardando</option>
              <option value="contacted">Oferta simulada</option>
              <option value="fulfilled">Encerrados</option>
            </select>
          </div>
          {filtered.length ? (
            <div className="waitlist-entries">
              {filtered.map((entry) => {
                const customer = data.customers.find(
                  (item) => item.id === entry.customerId,
                )!;
                const service = data.services.find(
                  (item) => item.id === entry.serviceId,
                )!;
                const professional = data.professionals.find(
                  (item) => item.id === entry.professionalId,
                );
                return (
                  <article className="waitlist-entry" key={entry.id}>
                    <div className="waitlist-entry-heading">
                      <Avatar
                        initials={initials(customer.name)}
                        small
                        color={professional?.color}
                      />
                      <div>
                        <strong>{customer.name}</strong>
                        <span>{customer.phone}</span>
                      </div>
                      <Badge
                        tone={
                          entry.status === "waiting"
                            ? "purple"
                            : entry.status === "contacted"
                              ? "blue"
                              : "neutral"
                        }
                      >
                        {entry.status === "waiting"
                          ? "Aguardando"
                          : entry.status === "contacted"
                            ? "Oferta simulada"
                            : "Encerrado"}
                      </Badge>
                    </div>
                    <div className="waitlist-entry-details">
                      <span>{service.name}</span>
                      <span>
                        {professional?.name ?? "Qualquer profissional"}
                      </span>
                      <span>
                        <Clock3 size={13} />
                        {dateLabel(entry.date, {
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        ·{" "}
                        {entry.preference === "morning"
                          ? "Manhã"
                          : entry.preference === "afternoon"
                            ? "Tarde"
                            : "Qualquer horário"}
                      </span>
                    </div>
                    <div className="waitlist-entry-actions">
                      {entry.status === "waiting" ? (
                        <Button
                          variant="secondary"
                          onClick={() => void changeStatus(entry, "contacted")}
                        >
                          <MessageCircle size={15} /> Simular oferta
                        </Button>
                      ) : null}
                      {entry.status !== "fulfilled" ? (
                        <button
                          className="subtle-link"
                          onClick={() => void changeStatus(entry, "fulfilled")}
                        >
                          Encerrar interesse <ArrowRight size={14} />
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Uma lista pronta para novas possibilidades."
              description={
                search
                  ? "Nenhum cliente encontrado para esta busca."
                  : "Adicione o interesse de um cliente por um serviço e uma data."
              }
            />
          )}
        </section>
        <aside className="waitlist-roadmap">
          <span className="roadmap-star">✦</span>
          <Badge>PRÓXIMA ETAPA</Badge>
          <h2>
            Um horário livre.
            <br />
            Um novo começo.
          </h2>
          <p>
            Estamos preparando um fluxo para conectar cancelamentos a novas
            oportunidades.
          </p>
          <ol>
            <li>
              <span>01</span> Identificar uma vaga na agenda
            </li>
            <li>
              <span>02</span> Encontrar clientes compatíveis
            </li>
            <li>
              <span>03</span> Oferecer o horário por WhatsApp
            </li>
            <li>
              <span>04</span> Reservar após a confirmação
            </li>
          </ol>
          <div>
            <Sparkles size={18} />
            <span>
              Esta tela é visual. Ofertas, mensagens e recuperação automática
              ainda não estão ativas.
            </span>
          </div>
        </aside>
      </div>
      {createOpen ? (
        <Modal
          title="Um interesse para acompanhar."
          description="Selecione o cuidado e a preferência do cliente."
          onClose={() => setCreateOpen(false)}
        >
          <WaitlistForm data={data} onDone={() => setCreateOpen(false)} />
        </Modal>
      ) : null}
    </>
  );
}

function WaitlistForm({
  data,
  onDone,
}: {
  data: DemoData;
  onDone: () => void;
}) {
  const tenantId = data.session!.tenantId;
  const services = data.services.filter(
    (item) => item.tenantId === tenantId && item.active,
  );
  const customers = data.customers.filter((item) => item.tenantId === tenantId);
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      await repository.saveWaitlist({
        id: newId("waitlist"),
        tenantId,
        customerId: String(fields.get("customer")),
        serviceId,
        professionalId: String(fields.get("professional") ?? ""),
        date: String(fields.get("date")),
        preference: fields.get("preference") as WaitlistEntry["preference"],
        status: "waiting",
      });
      toast("Interesse adicionado à lista de espera.");
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }
  if (!customers.length || !services.length)
    return (
      <EmptyState
        title="Vamos preparar este espaço?"
        description="Cadastre pelo menos um cliente e um serviço nesta unidade para adicionar um interesse."
        action={
          <ButtonLink
            href={!customers.length ? "/app/clientes" : "/app/servicos"}
          >
            Ir para cadastros
          </ButtonLink>
        }
      />
    );
  return (
    <form className="management-form" onSubmit={submit}>
      <div className="field">
        <label htmlFor="wait-customer">Cliente</label>
        <select id="wait-customer" name="customer" required>
          {customers.map((item) => (
            <option value={item.id} key={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="wait-service">Serviço</label>
        <select
          id="wait-service"
          value={serviceId}
          onChange={(event) => setServiceId(event.target.value)}
          required
        >
          {services.map((item) => (
            <option value={item.id} key={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="wait-professional">Profissional de preferência</label>
        <select id="wait-professional" name="professional" key={serviceId}>
          <option value="">Sem preferência</option>
          {data.professionals
            .filter(
              (item) =>
                item.tenantId === tenantId &&
                item.active &&
                item.serviceIds.includes(serviceId),
            )
            .map((item) => (
              <option value={item.id} key={item.id}>
                {item.name}
              </option>
            ))}
        </select>
      </div>
      <div className="form-two">
        <Field
          label="Data desejada"
          name="date"
          type="date"
          min={todayISO()}
          defaultValue={addDays(todayISO(), 1)}
          required
        />
        <div className="field">
          <label htmlFor="wait-preference">Período</label>
          <select id="wait-preference" name="preference">
            <option value="any">Qualquer horário</option>
            <option value="morning">Manhã</option>
            <option value="afternoon">Tarde</option>
          </select>
        </div>
      </div>
      <InlineError>{error}</InlineError>
      <div className="form-actions">
        <Button variant="ghost" type="button" onClick={onDone}>
          Voltar
        </Button>
        <Button type="submit" busy={busy}>
          Adicionar interesse
        </Button>
      </div>
    </form>
  );
}
