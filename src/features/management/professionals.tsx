"use client";

import { CalendarDays, Pencil, Plus, Search, Users } from "lucide-react";
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
import { initials, todayISO } from "@/lib/format";
import type { DemoData, Professional } from "@/types/domain";

export function Professionals() {
  const data = useDemo();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Professional | "new" | null>(null);
  if (!data?.session) return <PageSkeleton />;
  const professionals = data.professionals.filter(
    (item) =>
      item.tenantId === data.session?.tenantId &&
      `${item.name} ${item.specialty}`
        .toLocaleLowerCase("pt-BR")
        .includes(search.toLocaleLowerCase("pt-BR")),
  );
  return (
    <>
      <PageHeading
        eyebrow="GENTE QUE FAZ ACONTECER"
        title="Talentos que cuidam com você."
        description="Uma equipe em sintonia começa com tudo bem organizado."
        action={
          <Button onClick={() => setEditing("new")}>
            <Plus size={17} /> Novo profissional
          </Button>
        }
      />
      <div className="entity-page-toolbar">
        <label className="search-field">
          <Search size={17} />
          <input
            aria-label="Buscar profissionais"
            placeholder="Buscar nome ou especialidade..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <Badge tone="neutral">
          {professionals.filter((item) => item.active).length} profissionais
          ativos
        </Badge>
      </div>
      {professionals.length ? (
        <div className="professionals-grid">
          {professionals.map((professional) => (
            <article
              key={professional.id}
              className="panel professional-admin-card"
            >
              <div
                className={`professional-card-cover cover-${professional.color}`}
              >
                <span>✦</span>
                <button
                  className="icon-button"
                  aria-label={`Editar profissional ${professional.name}`}
                  onClick={() => setEditing(professional)}
                >
                  <Pencil size={16} />
                </button>
              </div>
              <div className="professional-admin-body">
                <Avatar
                  initials={professional.initials}
                  color={professional.color}
                />
                <Badge tone={professional.active ? "green" : "neutral"}>
                  {professional.active ? "Ativo" : "Inativo"}
                </Badge>
                <h2>{professional.name}</h2>
                <p>{professional.specialty}</p>
                <div className="professional-service-tags">
                  {data.services
                    .filter(
                      (item) =>
                        item.tenantId === professional.tenantId &&
                        professional.serviceIds.includes(item.id),
                    )
                    .map((service) => (
                      <span key={service.id}>{service.name}</span>
                    ))}
                </div>
                <div className="professional-today">
                  <CalendarDays size={17} />
                  <strong>
                    {
                      data.appointments.filter(
                        (item) =>
                          item.professionalId === professional.id &&
                          item.tenantId === professional.tenantId &&
                          item.date === todayISO() &&
                          !["canceled", "no_show"].includes(item.status),
                      ).length
                    }
                  </strong>
                  <span>atendimentos hoje</span>
                </div>
                <Button
                  variant="secondary"
                  className="full-width"
                  onClick={() => setEditing(professional)}
                >
                  Ver e editar perfil <Pencil size={14} />
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="panel">
          <EmptyState
            title="Um espaço para novos talentos."
            description={
              search
                ? "Nenhum profissional corresponde à busca."
                : "Adicione o primeiro profissional e associe seus serviços."
            }
            action={
              <Button variant="secondary" onClick={() => setEditing("new")}>
                Adicionar profissional
              </Button>
            }
          />
        </section>
      )}
      <p className="page-footnote">
        <Users size={15} /> A equipe pode conhecer sua agenda individual pelo
        acesso demonstrativo de funcionário.
      </p>
      {editing ? (
        <Modal
          title={
            editing === "new"
              ? "Mais um talento por aqui."
              : "Um perfil feito para cuidar."
          }
          description="Defina quais serviços este profissional oferece."
          onClose={() => setEditing(null)}
        >
          <ProfessionalForm
            key={editing === "new" ? "new" : editing.id}
            professional={editing === "new" ? undefined : editing}
            data={data}
            onDone={() => setEditing(null)}
          />
        </Modal>
      ) : null}
    </>
  );
}

function ProfessionalForm({
  professional,
  data,
  onDone,
}: {
  professional?: Professional;
  data: DemoData;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();
  const services = data.services.filter(
    (item) => item.tenantId === data.session?.tenantId,
  );
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const serviceIds = fields.getAll("services").map(String);
    if (fields.get("active") === "on" && !serviceIds.length) {
      setError("Associe ao menos um serviço ao profissional ativo.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const name = String(fields.get("name")).trim();
      await repository.saveProfessional({
        id: professional?.id ?? newId("professional"),
        tenantId: data.session!.tenantId,
        name,
        initials: initials(name),
        specialty: String(fields.get("specialty")).trim(),
        serviceIds,
        active: fields.get("active") === "on",
        color: fields.get("color") as Professional["color"],
      });
      toast(
        professional
          ? "Perfil atualizado. Sua equipe está em sintonia."
          : "Um novo talento chegou à equipe.",
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
      <Field
        label="Nome completo"
        name="name"
        defaultValue={professional?.name}
        required
        minLength={3}
        maxLength={100}
      />
      <Field
        label="Especialidade"
        name="specialty"
        defaultValue={professional?.specialty}
        placeholder="O cuidado que esta pessoa oferece"
        required
        maxLength={100}
      />
      <div className="field">
        <label htmlFor="professional-color">Cor na agenda</label>
        <select
          id="professional-color"
          name="color"
          defaultValue={professional?.color ?? "purple"}
        >
          <option value="purple">Roxo</option>
          <option value="peach">Pêssego</option>
          <option value="blue">Azul</option>
        </select>
      </div>
      <fieldset className="service-checkboxes">
        <legend>Serviços oferecidos</legend>
        {services.length ? (
          services.map((service) => (
            <label key={service.id} className="checkbox-label">
              <input
                name="services"
                value={service.id}
                type="checkbox"
                defaultChecked={professional?.serviceIds.includes(service.id)}
              />
              {service.name}
              {!service.active ? " (inativo)" : ""}
            </label>
          ))
        ) : (
          <p>Cadastre um serviço antes de ativar este profissional.</p>
        )}
      </fieldset>
      <label className="checkbox-label">
        <input
          name="active"
          type="checkbox"
          defaultChecked={professional?.active ?? true}
        />{" "}
        Profissional ativo e disponível no agendamento
      </label>
      <InlineError>{error}</InlineError>
      <div className="form-actions">
        <Button type="button" variant="ghost" onClick={onDone}>
          Voltar
        </Button>
        <Button type="submit" busy={busy}>
          Salvar profissional
        </Button>
      </div>
    </form>
  );
}
