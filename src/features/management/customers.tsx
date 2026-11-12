"use client";

import {
  ArrowLeft,
  ArrowRight,
  Pencil,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import {
  Avatar,
  Badge,
  Button,
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
import { currency, dateLabel, initials, phoneDigits } from "@/lib/format";
import type { Customer, DemoData } from "@/types/domain";

export function Customers() {
  const data = useDemo();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Customer | "new" | null>(null);
  if (!data?.session) return <PageSkeleton />;
  const tenantId = data.session.tenantId;
  const customers = data.customers.filter((item) => item.tenantId === tenantId);
  const visits = (id: string) =>
    data.appointments.filter(
      (item) =>
        item.customerId === id &&
        item.tenantId === tenantId &&
        item.status === "completed",
    );
  const filtered = customers.filter(
    (item) =>
      `${item.name} ${item.phone} ${item.email}`
        .toLocaleLowerCase("pt-BR")
        .includes(search.toLocaleLowerCase("pt-BR")) &&
      (filter === "all" ||
        (filter === "returning"
          ? visits(item.id).length > 1
          : visits(item.id).length <= 1)),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 8));
  const currentPage = Math.min(page, pages - 1);
  return (
    <>
      <PageHeading
        eyebrow="QUEM FAZ PARTE DA SUA HISTÓRIA"
        title="Pessoas antes de números."
        description="Cada cliente, um cuidado. Todas as informações no mesmo lugar."
        action={
          <Button onClick={() => setEditing("new")}>
            <Plus size={17} /> Novo cliente
          </Button>
        }
      />
      <div className="entity-summary">
        <div>
          <span className="entity-summary-icon">
            <Users size={22} />
          </span>
          <span>
            <strong>{customers.length.toString().padStart(2, "0")}</strong>{" "}
            clientes no seu espaço
          </span>
        </div>
        <div>
          <span className="small-dot" />
          {customers.filter((item) => visits(item.id).length > 1).length} já
          voltaram para um novo cuidado
        </div>
      </div>
      <section className="panel">
        <div className="table-toolbar">
          <label className="search-field">
            <Search size={17} />
            <input
              aria-label="Buscar clientes"
              placeholder="Buscar nome, telefone ou e-mail..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
            />
          </label>
          <select
            aria-label="Filtrar clientes"
            value={filter}
            onChange={(event) => {
              setFilter(event.target.value);
              setPage(0);
            }}
          >
            <option value="all">Todos os clientes</option>
            <option value="returning">Recorrentes</option>
            <option value="new">Novos / primeira visita</option>
          </select>
        </div>
        {filtered.length ? (
          <div
            className="table-scroll"
            role="region"
            aria-label="Tabela de clientes"
            tabIndex={0}
          >
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Contato</th>
                  <th>Visitas</th>
                  <th>Último cuidado</th>
                  <th>Relacionamento</th>
                  <th>
                    <span className="sr-only">Editar</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered
                  .slice(currentPage * 8, currentPage * 8 + 8)
                  .map((customer, i) => {
                    const completed = visits(customer.id).sort((a, b) =>
                      b.date.localeCompare(a.date),
                    );
                    return (
                      <tr key={customer.id}>
                        <td>
                          <div className="table-person">
                            <Avatar
                              initials={initials(customer.name)}
                              small
                              color={["purple", "peach", "blue"][i % 3]}
                            />
                            <div>
                              <strong>{customer.name}</strong>
                              <small>
                                {customer.email || "Sem e-mail cadastrado"}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>{customer.phone}</td>
                        <td>
                          <strong>
                            {completed.length.toString().padStart(2, "0")}
                          </strong>
                        </td>
                        <td>
                          {completed[0]
                            ? dateLabel(completed[0].date, {
                                day: "2-digit",
                                month: "short",
                              })
                            : "Primeiro encontro a caminho"}
                        </td>
                        <td>
                          <Badge
                            tone={completed.length > 1 ? "green" : "purple"}
                          >
                            {completed.length > 1
                              ? "Recorrente"
                              : "Novo por aqui"}
                          </Badge>
                        </td>
                        <td>
                          <button
                            className="icon-button"
                            aria-label={`Ver cliente ${customer.name}`}
                            onClick={() => setEditing(customer)}
                          >
                            <Pencil size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="Nenhum cliente por aqui ainda."
            description={
              search
                ? "Experimente outro nome ou contato na busca."
                : "Adicione seu primeiro cliente para começar uma nova história."
            }
            action={
              !search ? (
                <Button variant="secondary" onClick={() => setEditing("new")}>
                  Adicionar cliente
                </Button>
              ) : undefined
            }
          />
        )}
        <div className="table-pagination">
          <span>{filtered.length} clientes encontrados</span>
          <div>
            <button
              className="icon-button"
              disabled={currentPage === 0}
              onClick={() => setPage(currentPage - 1)}
              aria-label="Página anterior"
            >
              <ArrowLeft size={16} />
            </button>
            <span>
              {currentPage + 1} de {pages}
            </span>
            <button
              className="icon-button"
              disabled={currentPage >= pages - 1}
              onClick={() => setPage(currentPage + 1)}
              aria-label="Próxima página"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>
      {editing ? (
        <Modal
          title={
            editing === "new"
              ? "Uma nova história começa."
              : "Um olhar para o cliente."
          }
          description="Informações demonstrativas para cuidar de cada detalhe."
          onClose={() => setEditing(null)}
        >
          <CustomerForm
            key={editing === "new" ? "new" : editing.id}
            customer={editing === "new" ? undefined : editing}
            data={data}
            onDone={() => setEditing(null)}
          />
        </Modal>
      ) : null}
    </>
  );
}

function CustomerForm({
  customer,
  data,
  onDone,
}: {
  customer?: Customer;
  data: DemoData;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();
  const history = data.appointments.filter(
    (item) =>
      item.tenantId === data.session?.tenantId &&
      item.customerId === customer?.id &&
      item.status === "completed",
  );
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const phone = phoneDigits(String(fields.get("phone")));
    if (![10, 11].includes(phone.length)) {
      setError("Informe um telefone com DDD e 10 ou 11 dígitos.");
      return;
    }
    if (
      data.customers.some(
        (item) =>
          item.tenantId === data.session?.tenantId &&
          item.id !== customer?.id &&
          phoneDigits(item.phone) === phone,
      )
    ) {
      setError("Já existe um cliente com este telefone nesta unidade.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await repository.saveCustomer({
        id: customer?.id ?? newId("customer"),
        tenantId: data.session!.tenantId,
        name: String(fields.get("name")).trim(),
        phone,
        email: String(fields.get("email") ?? ""),
        notes: String(fields.get("notes") ?? ""),
      });
      toast(
        customer
          ? "Dados do cliente atualizados."
          : "Um novo cliente chegou ao seu espaço.",
      );
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="management-form" onSubmit={submit}>
      {customer ? (
        <div className="customer-history-summary">
          <span>
            <strong>{history.length}</strong> visitas concluídas
          </span>
          <span>
            <strong>
              {currency(history.reduce((sum, item) => sum + item.price, 0))}
            </strong>{" "}
            em atendimentos
          </span>
        </div>
      ) : null}
      <Field
        name="name"
        label="Nome completo"
        defaultValue={customer?.name}
        required
        minLength={3}
        maxLength={100}
      />
      <div className="form-two">
        <Field
          name="phone"
          label="Telefone com DDD"
          type="tel"
          defaultValue={customer?.phone}
          required
          pattern="[\d\s()+-]{10,17}"
          maxLength={17}
        />
        <Field
          name="email"
          label="E-mail (opcional)"
          type="email"
          defaultValue={customer?.email}
          maxLength={150}
        />
      </div>
      <div className="field">
        <label htmlFor="customer-notes">Observações</label>
        <textarea
          id="customer-notes"
          name="notes"
          defaultValue={customer?.notes}
          placeholder="Preferências e detalhes para um cuidado melhor."
          maxLength={500}
          rows={3}
        />
      </div>
      <InlineError>{error}</InlineError>
      <div className="form-actions">
        <Button type="button" variant="ghost" onClick={onDone}>
          Voltar
        </Button>
        <Button type="submit" busy={busy}>
          Salvar cliente
        </Button>
      </div>
    </form>
  );
}
