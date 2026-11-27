"use client";

import { useEffect, useState } from "react";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function requestBookinfy<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`/api/bookinfy/${path}`, {
    ...init,
    cache: "no-store",
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
  });
  const data = await response.json();
  if (!response.ok)
    throw new ApiError(
      response.status,
      data.error ?? "Não foi possível concluir a operação.",
    );
  return data as T;
}

export function apiMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Não foi possível conectar. Tente novamente.";
}

export function useBookinfyRequest<T>(path: string | null) {
  const [attempt, setAttempt] = useState(0);
  const key = `${attempt}:${path}`;
  const [state, setState] = useState<{
    key: string;
    data: T | null;
    error: ApiError | null;
  }>();
  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    requestBookinfy<T>(path, { signal: controller.signal }).then(
      (data) => {
        if (!controller.signal.aborted) setState({ key, data, error: null });
      },
      (error: unknown) => {
        if (!controller.signal.aborted) {
          setState({
            key,
            data: null,
            error:
              error instanceof ApiError
                ? error
                : new ApiError(0, apiMessage(error)),
          });
        }
      },
    );
    return () => controller.abort();
  }, [key, path]);

  return {
    data: path && state?.key === key ? state.data : null,
    error: path && state?.key === key ? state.error : null,
    loading: Boolean(path && state?.key !== key),
    retry: () => setAttempt((previous) => previous + 1),
  };
}

export interface PublicBusiness {
  slug: string;
  name: string;
  address: string;
  city: string;
  opensAt: number;
  closesAt: number;
  weekdays: number[];
}

export function businessPath(slug: string) {
  return `public/businesses/${encodeURIComponent(slug)}`;
}
