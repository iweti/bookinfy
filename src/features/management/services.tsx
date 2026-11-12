"use client";

import { Clock3, Pencil, Plus, Scissors, Search, Users } from "lucide-react";
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
import { currency } from "@/lib/format";
import type { DemoData, Service } from "@/types/domain";

export function Services() {
  const data = useDemo();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("active");
  const [editing, setEditing] = useState<Service | "new" | null>(null);
  if (!data?.session) return <PageSkeleton />;
  const services = data.services.filter(
    (item) =>
      item.tenantId === data.session?.tenantId &&
      `${item.name} ${item.category}`
        .toLocaleLowerCase("pt-BR")
        .includes(search.toLocaleLowerCase("pt-BR")) &&
      (filter === "all" || item.active === (filter === "active")),
  );
  return (
    <>
      <PageHeading
        eyebrow="O CUIDADO QUE VOCÊ OFERECE"
        title="Cada serviço, uma possibilidade."
        description="Organize seu catálogo, os valores e o tempo de cada cuidado."
        action={
          <Button onClick={() => setEditing("new")}>
            <Plus size={17} /> Novo serviço
          </Button>
        }
      />
      <div className="entity-page-toolbar">
        <label className="search-field">
          <Search size={17} />
          <input
            aria-label="Buscar serviços"
            placeholder="Buscar serviço ou categoria..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <select
          aria-label="Filtrar serviços"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="active">Serviços ativos</option>
          <option value="inactive">Serviços inativos</option>
          <option value="all">Todos os serviços</option>
        </select>
      </div>
      {services.length ? (
        <div className="services-grid">
          {services.map((service, i) => (
            <article className="panel service-admin-card" key={service.id}>
              <div>
                <span
                  className={`service-admin-icon ${["purple", "peach", "blue"][i % 3]}`}
                >
                  <Scissors size={24} />
                </span>
                <Badge tone={service.active ? "green" : "neutral"}>
                  {service.active ? "Ativo" : "Inativo"}
                </Badge>
                <button
                  className="icon-button"
                  aria-label={`Editar serviço ${service.name}`}
                  onClick={() => setEditing(service)}
                >
                  <Pencil size={16} />
                </button>
              </div>
              <p className="eyebrow">{service.category}</p>
              <h2>{service.name}</h2>
              <p>{service.description}</p>
              <div className="service-admin-value">
                <strong>{currency(service.price)}</strong>
                <span>
                  <Clock3 size={15} /> {service.duration} min
                </span>
              </div>
              <div className="service-admin-team">
                <div className="avatar-stack">
                  {data.professionals
                    .filter(
                      (item) =>
                        item.tenantId === service.tenantId &&
                        item.active &&
                        item.serviceIds.includes(service.id),
                    )
                    .slice(0, 3)
                    .map((professional) => (
                      <Avatar
                        key={professional.id}
                        initials={professional.initials}
                        color={professional.color}
                        small
                      />
                    ))}
                </div>
                <span>
                  {
                    data.professionals.filter(
                      (item) =>
                        item.tenantId === service.tenantId &&
                        item.active &&
                        item.serviceIds.includes(service.id),
                    ).length
                  }{" "}
                  profissionais
                </span>
              </div>
              <button
                className="service-edit-link"
                onClick={() => setEditing(service)}
              >
                Editar serviço <Pencil size={14} />
              </button>
            </article>
          ))}
        </div>
      ) : (
        <section className="panel">
          <EmptyState
            title="Seu catálogo começa com um cuidado."
            description={
              search
                ? "Nenhum serviço corresponde à busca."
                : "Adicione um serviço e vincule profissionais para disponibilizá-lo no agendamento."
            }
            action={
              <Button variant="secondary" onClick={() => setEditing("new")}>
                Adicionar serviço
              </Button>
            }
          />
        </section>
      )}
      <p className="page-footnote">
        <Users size={15} /> Associe novos serviços aos profissionais para abrir
        os horários no agendamento público.
      </p>
      {editing ? (
        <Modal
          title={
            editing === "new"
              ? "Um novo cuidado no catálogo."
              : "Vamos ajustar este cuidado."
          }
          description="Atendimentos existentes preservam o valor e a duração originais."
          onClose={() => setEditing(null)}
        >
          <ServiceForm
            key={editing === "new" ? "new" : editing.id}
            service={editing === "new" ? undefined : editing}
            data={data}
            onDone={() => setEditing(null)}
          />
        </Modal>
      ) : null}
    </>
  );
}

function ServiceForm({
  service,
  data,
  onDone,
}: {
  service?: Service;
  data: DemoData;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      await repository.saveService({
        id: service?.id ?? newId("service"),
        tenantId: data.session!.tenantId,
        name: String(fields.get("name")).trim(),
        description: String(fields.get("description")),
        category: String(fields.get("category")).trim(),
        duration: Number(fields.get("duration")),
        price: Number(fields.get("price")),
        active: fields.get("active") === "on",
      });
      toast(
        service
          ? "Serviço atualizado no seu catálogo."
          : "Novo serviço cadastrado. Vincule um profissional para disponibilizar horários.",
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
        label="Nome do serviço"
        name="name"
        defaultValue={service?.name}
        required
        minLength={3}
        maxLength={100}
      />
      <Field
        label="Categoria"
        name="category"
        defaultValue={service?.category}
        placeholder="Cabelo, barba, estética..."
        required
        maxLength={50}
      />
      <div className="field">
        <label htmlFor="service-description">Descrição</label>
        <textarea
          id="service-description"
          name="description"
          defaultValue={service?.description}
          rows={3}
          maxLength={300}
          required
        />
      </div>
      <div className="form-two">
        <Field
          label="Duração (minutos)"
          name="duration"
          type="number"
          defaultValue={service?.duration ?? 30}
          min={15}
          max={480}
          step={15}
          required
        />
        <Field
          label="Valor (R$)"
          name="price"
          type="number"
          defaultValue={service?.price ?? 50}
          min={0}
          max={100000}
          step={0.01}
          required
        />
      </div>
      <label className="checkbox-label">
        <input
          type="checkbox"
          name="active"
          defaultChecked={service?.active ?? true}
        />{" "}
        Serviço ativo e disponível para agendamento
      </label>
      <InlineError>{error}</InlineError>
      <div className="form-actions">
        <Button type="button" variant="ghost" onClick={onDone}>
          Voltar
        </Button>
        <Button type="submit" busy={busy}>
          Salvar serviço
        </Button>
      </div>
    </form>
  );
}
