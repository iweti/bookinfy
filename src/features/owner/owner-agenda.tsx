"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Brand } from "@/components/layout/brand";
import {
  Button,
  ButtonLink,
  EmptyState,
  Field,
  InlineError,
  PageHeading,
  PageSkeleton,
} from "@/components/ui/primitives";
import {
  apiMessage,
  requestBookinfy,
  useBookinfyRequest,
  type PublicBusiness,
} from "@/lib/bookinfy/api-client";
import { currency, isISODate, todayISO } from "@/lib/format";
import { statusLabels } from "@/lib/scheduling";
import type { AppointmentStatus } from "@/types/domain";

type Appointment = {
  id: string;
  customerName: string;
  service: string;
  professional: string;
  time: string;
  duration: number;
  priceCents: number;
  status: AppointmentStatus;
};

export function OwnerAgenda() {
  const router = useRouter();
  const session = useBookinfyRequest<PublicBusiness[]>("session");
  const [selectedBusiness, setSelectedBusiness] = useState("");
  const [date, setDate] = useState(todayISO);
  const [logoutError, setLogoutError] = useState("");
  const [leaving, setLeaving] = useState(false);
  const business =
    session.data?.find((item) => item.slug === selectedBusiness) ??
    session.data?.[0];
  const agenda = useBookinfyRequest<Appointment[]>(
    business && isISODate(date)
      ? `owner/businesses/${encodeURIComponent(business.slug)}/agenda?date=${date}`
      : null,
  );
  const expired = session.error?.status === 401 || agenda.error?.status === 401;

  async function signOut() {
    setLeaving(true);
    setLogoutError("");
    try {
      await requestBookinfy("session", { method: "DELETE" });
      router.replace("/login");
    } catch (err) {
      setLogoutError(apiMessage(err));
      setLeaving(false);
    }
  }

  return (
    <>
      <header className="booking-header container">
        <Brand />
        {session.data && !expired ? (
          <Button variant="secondary" onClick={signOut} busy={leaving}>
            Sair
          </Button>
        ) : null}
      </header>
      <main id="main" className="booking-main container">
        {expired ? (
          <EmptyState
            title="Entre para ver sua agenda"
            description="Use a conta do estabelecimento para continuar."
            action={<ButtonLink href="/login">Entrar no painel</ButtonLink>}
          />
        ) : session.loading ? (
          <PageSkeleton />
        ) : session.error ? (
          <EmptyState
            title="Não foi possível abrir o painel"
            description={session.error.message}
            action={<Button onClick={session.retry}>Tentar novamente</Button>}
          />
        ) : !business ? (
          <EmptyState
            title="Nenhum estabelecimento vinculado"
            description="Esta conta ainda não tem uma agenda associada."
          />
        ) : (
          <>
            <PageHeading
              title="Agenda"
              description={business.name}
              action={
                <ButtonLink
                  variant="secondary"
                  href={`/agendar/servico?unidade=${encodeURIComponent(business.slug)}`}
                >
                  Abrir página de agendamento
                </ButtonLink>
              }
            />
            <InlineError>{logoutError}</InlineError>
            <div className="booking-selection">
              <div className="form-two">
                <div className="field">
                  <label htmlFor="owner-business">Estabelecimento</label>
                  <select
                    id="owner-business"
                    value={business.slug}
                    onChange={(event) =>
                      setSelectedBusiness(event.target.value)
                    }
                  >
                    {session.data?.map((item) => (
                      <option key={item.slug} value={item.slug}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Field
                  label="Data da agenda"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </div>
              <Button
                variant="secondary"
                onClick={agenda.retry}
                disabled={!isISODate(date)}
                busy={agenda.loading}
              >
                Atualizar agenda
              </Button>
              {agenda.error ? (
                <InlineError>{agenda.error.message}</InlineError>
              ) : null}
              {agenda.data?.length ? (
                <div
                  className="table-scroll"
                  role="region"
                  aria-label="Tabela de agendamentos"
                  tabIndex={0}
                >
                  <table>
                    <caption className="sr-only">
                      Agendamentos de {business.name}
                    </caption>
                    <thead>
                      <tr>
                        <th>Horário</th>
                        <th>Cliente</th>
                        <th>Serviço</th>
                        <th>Profissional</th>
                        <th>Valor</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agenda.data.map((item) => (
                        <tr key={item.id}>
                          <td>
                            {item.time} · {item.duration} min
                          </td>
                          <td>{item.customerName}</td>
                          <td>{item.service}</td>
                          <td>{item.professional}</td>
                          <td>{currency(item.priceCents / 100)}</td>
                          <td>{statusLabels[item.status]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : agenda.data ? (
                <EmptyState
                  title="Sem agendamentos nesta data"
                  description="Selecione outra data para consultar a agenda."
                />
              ) : null}
            </div>
          </>
        )}
      </main>
    </>
  );
}
