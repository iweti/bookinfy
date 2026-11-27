"use client";

import { useSearchParams } from "next/navigation";
import { useSyncExternalStore } from "react";
import {
  businessPath,
  requestBookinfy,
  useBookinfyRequest,
} from "@/lib/bookinfy/api-client";
import type { PublicBusiness } from "@/lib/bookinfy/api-client";
import { initials } from "@/lib/format";
import { timeOf } from "@/lib/scheduling";
import type {
  BookingDraft,
  DemoData,
  Professional,
  Service,
  Tenant,
} from "@/types/domain";

export type BookingCatalog = Pick<
  DemoData,
  "tenants" | "services" | "professionals"
>;
export type BookingConfirmation = {
  id: string;
  business: string;
  service: string;
  professional: string;
  address: string;
  date: string;
  time: string;
  duration: number;
  price: number;
};
export type SubmitBooking = (
  draft: BookingDraft,
  requestId: string,
) => Promise<{ id?: string; error?: string }>;

type LiveCatalog = {
  business: PublicBusiness;
  services: (Omit<Service, "tenantId" | "active" | "price"> & {
    priceCents: number;
  })[];
  professionals: Pick<
    Professional,
    "id" | "name" | "specialty" | "serviceIds"
  >[];
};

type LiveConfirmation = Omit<BookingConfirmation, "address" | "price"> & {
  priceCents: number;
};

const emptyCatalog: BookingCatalog = {
  tenants: [],
  services: [],
  professionals: [],
};
const serverSnapshot = () => null;
const subscribe = () => () => {};
let lastConfirmation: BookingConfirmation | null = null;

function tenant(business: PublicBusiness): Tenant {
  return {
    id: business.slug,
    name: business.name,
    city: business.city,
    address: business.address,
    weekdays: business.weekdays,
    open: timeOf(business.opensAt),
    close: timeOf(business.closesAt),
    phone: "",
    segment: "Estabelecimento",
  };
}

export function useLiveCatalog({
  list,
  confirmation,
}: {
  list: boolean;
  confirmation: boolean;
}) {
  const slug = useSearchParams().get("unidade");
  const businesses = useBookinfyRequest<PublicBusiness[]>(
    list ? "public/businesses" : null,
  );
  const detail = useBookinfyRequest<LiveCatalog>(
    !list && !confirmation && slug ? businessPath(slug) : null,
  );
  const data = detail.data;
  const error = list ? businesses.error : detail.error;
  return {
    error: error?.status === 404 && !list ? null : error,
    retry: list ? businesses.retry : detail.retry,
    catalog:
      businesses.loading || detail.loading
        ? null
        : data
          ? {
              tenants: [tenant(data.business)],
              services: data.services.map(({ priceCents, ...service }) => ({
                ...service,
                tenantId: data.business.slug,
                active: true,
                price: priceCents / 100,
                category: service.category || "Serviços",
              })),
              professionals: data.professionals.map((person) => ({
                ...person,
                tenantId: data.business.slug,
                active: true,
                color: "purple" as const,
                initials: initials(person.name),
              })),
            }
          : { ...emptyCatalog, tenants: businesses.data?.map(tenant) ?? [] },
  };
}

export function useLiveConfirmation(id: string | null) {
  const raw = useSyncExternalStore(
    subscribe,
    () => {
      if (!id) return null;
      if (lastConfirmation?.id === id) return JSON.stringify(lastConfirmation);
      try {
        return sessionStorage.getItem(`bookinfy.confirmation.${id}`);
      } catch {
        return null;
      }
    },
    serverSnapshot,
  );
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BookingConfirmation;
  } catch {
    return null;
  }
}

export async function createLiveBooking(
  { tenantId, ...draft }: BookingDraft,
  requestId: string,
  address: string,
) {
  const summary = await requestBookinfy<LiveConfirmation>(
    `${businessPath(tenantId)}/appointments`,
    {
      method: "POST",
      body: JSON.stringify({ ...draft, requestId }),
    },
  );
  const { priceCents, ...details } = summary;
  lastConfirmation = { ...details, address, price: priceCents / 100 };
  try {
    sessionStorage.setItem(
      `bookinfy.confirmation.${summary.id}`,
      JSON.stringify(lastConfirmation),
    );
  } catch {
    // The in-memory confirmation is still available during client navigation.
  }
  return { id: summary.id };
}
