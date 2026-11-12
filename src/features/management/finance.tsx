"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Plus,
  Search,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import {
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
import { MetricCard } from "@/features/dashboard/dashboard";
import { useDemo } from "@/lib/data/use-demo";
import { newId, repository } from "@/lib/data/mock-repository";
import { currency, dateLabel, todayISO } from "@/lib/format";
import type { DemoData } from "@/types/domain";

export function Finance() {
  const data = useDemo();
  const [month, setMonth] = useState(todayISO().slice(0, 7));
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const toast = useToast();
  if (!data?.session) return <PageSkeleton />;
  const tenantId = data.session.tenantId;
  const appointments = data.appointments.filter(
    (item) => item.tenantId === tenantId && item.date.startsWith(month),
  );
  const expenses = data.expenses.filter(
    (item) => item.tenantId === tenantId && item.date.startsWith(month),
  );
  const completed = appointments.filter((item) => item.status === "completed");
  const income = completed.reduce((sum, item) => sum + item.price, 0);
  const forecast = appointments
    .filter((item) => !["canceled", "no_show"].includes(item.status))
    .reduce((sum, item) => sum + item.price, 0);
  const out = expenses.reduce((sum, item) => sum + item.amount, 0);
  const rows = [
    ...appointments
      .filter((item) => !["canceled", "no_show"].includes(item.status))
      .map((item) => ({
        id: item.id,
        title:
          data.customers.find((customer) => customer.id === item.customerId)
            ?.name ?? "Cliente",
        subtitle:
          data.services.find((service) => service.id === item.serviceId)
            ?.name ?? "Atendimento",
        date: item.date,
        amount: item.price,
        type: item.status === "completed" ? "income" : "forecast",
      })),
    ...expenses.map((item) => ({
      ...item,
      subtitle: item.category,
      type: "expense",
    })),
  ]
    .filter(
      (item) =>
        (filter === "all" || item.type === filter) &&
        `${item.title} ${item.subtitle}`
          .toLocaleLowerCase("pt-BR")
          .includes(search.toLocaleLowerCase("pt-BR")),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  function exportCSV() {
    const escape = (value: string) =>
      `"${(/^[=+@\-\t\r]/.test(value) ? "'" : "") + value.replace(/"/g, '""')}"`;
    const labels: Record<string, string> = {
      income: "Concluído",
      forecast: "Previsto",
      expense: "Despesa",
    };
    const csv =
      "\ufeffData;Descrição;Categoria;Tipo;Valor (R$)\r\n" +
      rows
        .map((row) =>
          [
            row.date,
            escape(row.title),
            escape(row.subtitle),
            labels[row.type],
            (row.type === "expense" ? -row.amount : row.amount)
              .toFixed(2)
              .replace(".", ","),
          ].join(";"),
        )
        .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `bookinfy-financeiro-demo-${month}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("Relatório demonstrativo exportado com os filtros atuais.");
  }
  return (
    <>
      <PageHeading
        eyebrow="CLAREZA PARA SEGUIR EM FRENTE"
        title="Seu negócio, em números."
        description="Acompanhe os atendimentos e organize as despesas da sua rotina."
        action={
          <div className="heading-actions">
            <Button
              variant="secondary"
              onClick={exportCSV}
              disabled={!rows.length}
            >
              <Download size={16} /> Exportar
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus size={17} /> Nova despesa
            </Button>
          </div>
        }
      />
      <div className="finance-period">
        <label htmlFor="finance-month">Um olhar para</label>
        <input
          id="finance-month"
          type="month"
          value={month}
          onChange={(event) => {
            if (event.target.value) setMonth(event.target.value);
          }}
        />
        <Badge tone="neutral">
          Valores demonstrativos · sem pagamentos reais
        </Badge>
      </div>
      <div className="metrics-grid">
        <MetricCard
          label="Receita concluída"
          value={currency(income)}
          note="Atendimentos finalizados no mês"
          icon={ArrowDownLeft}
          tone="green"
        />
        <MetricCard
          label="Faturamento previsto"
          value={currency(forecast)}
          note="Concluídos + reservas ativas no mês"
          icon={TrendingUp}
        />
        <MetricCard
          label="Despesas"
          value={currency(out)}
          note="Despesas lançadas na demonstração"
          icon={ArrowUpRight}
          tone="peach"
        />
        <MetricCard
          label="Saldo demonstrativo"
          value={currency(income - out)}
          note="Receita concluída menos despesas"
          icon={Wallet}
          tone="blue"
        />
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Um olhar para cada movimento</h2>
            <p>Atendimentos, previsões e despesas no mesmo lugar.</p>
          </div>
        </div>
        <div className="table-toolbar">
          <label className="search-field">
            <Search size={17} />
            <input
              aria-label="Buscar movimentações"
              placeholder="Buscar movimentação..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <select
            aria-label="Filtrar movimentações"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">Todas as movimentações</option>
            <option value="income">Atendimentos concluídos</option>
            <option value="forecast">Atendimentos previstos</option>
            <option value="expense">Despesas</option>
          </select>
        </div>
        {rows.length ? (
          <div
            className="table-scroll finance-table"
            role="region"
            aria-label="Tabela de movimentações financeiras"
            tabIndex={0}
          >
            <table>
              <thead>
                <tr>
                  <th>Movimentação</th>
                  <th>Data</th>
                  <th>Categoria</th>
                  <th>Situação</th>
                  <th className="text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="table-person">
                        <span
                          className={`transaction-icon ${row.type === "expense" ? "peach" : row.type === "income" ? "green" : "purple"}`}
                        >
                          {row.type === "expense" ? (
                            <ArrowUpRight size={18} />
                          ) : (
                            <ArrowDownLeft size={18} />
                          )}
                        </span>
                        <strong>{row.title}</strong>
                      </div>
                    </td>
                    <td>
                      {dateLabel(row.date, { day: "2-digit", month: "short" })}
                    </td>
                    <td>{row.subtitle}</td>
                    <td>
                      <Badge
                        tone={
                          row.type === "income"
                            ? "green"
                            : row.type === "expense"
                              ? "peach"
                              : "purple"
                        }
                      >
                        {row.type === "income"
                          ? "Concluído"
                          : row.type === "expense"
                            ? "Despesa"
                            : "Previsto"}
                      </Badge>
                    </td>
                    <td className={`text-right amount-${row.type}`}>
                      <strong>
                        {row.type === "expense" ? "− " : ""}
                        {currency(row.amount)}
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="Um mês pronto para começar."
            description="Não há movimentações para o período e os filtros selecionados."
          />
        )}
        <div className="table-pagination">
          <span>{rows.length} movimentações no período</span>
          <span>Dados de demonstração</span>
        </div>
      </section>
      {createOpen ? (
        <Modal
          title="Um novo movimento."
          description="Registre uma despesa fictícia para explorar o financeiro."
          onClose={() => setCreateOpen(false)}
        >
          <ExpenseForm data={data} onDone={() => setCreateOpen(false)} />
        </Modal>
      ) : null}
    </>
  );
}

function ExpenseForm({ data, onDone }: { data: DemoData; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      await repository.saveExpense({
        id: newId("expense"),
        tenantId: data.session!.tenantId,
        title: String(fields.get("title")).trim(),
        category: String(fields.get("category")),
        amount: Number(fields.get("amount")),
        date: String(fields.get("date")),
      });
      toast("Despesa adicionada à demonstração.");
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="management-form" onSubmit={submit}>
      <Field
        name="title"
        label="Descrição da despesa"
        required
        minLength={3}
        maxLength={100}
      />
      <div className="field">
        <label htmlFor="expense-category">Categoria</label>
        <select id="expense-category" name="category">
          <option>Insumos</option>
          <option>Estrutura</option>
          <option>Operação</option>
          <option>Outros</option>
        </select>
      </div>
      <div className="form-two">
        <Field
          label="Valor (R$)"
          name="amount"
          type="number"
          min={0.01}
          step={0.01}
          required
          max={1000000}
        />
        <Field
          label="Data"
          name="date"
          type="date"
          defaultValue={todayISO()}
          required
        />
      </div>
      <InlineError>{error}</InlineError>
      <div className="form-actions">
        <Button type="button" variant="ghost" onClick={onDone}>
          Voltar
        </Button>
        <Button type="submit" busy={busy}>
          Salvar despesa
        </Button>
      </div>
    </form>
  );
}
