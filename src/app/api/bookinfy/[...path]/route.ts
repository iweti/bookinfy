import type { NextRequest } from "next/server";
import { liveMode } from "@/lib/bookinfy/mode";

const slug = "[a-z0-9]+(?:-[a-z0-9]+)*";
const catalog = new RegExp(`^public/businesses/${slug}(?:/slots)?$`);
const booking = new RegExp(`^public/businesses/${slug}/appointments$`);
const agenda = new RegExp(`^owner/businesses/${slug}/agenda$`);
const sessionCookie = "bookinfy_session";

function failure(status: number, error: string) {
  return Response.json(
    { error },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: parts } = await context.params;
  const path = parts.join("/");
  const method = request.method;
  const session = path === "session";
  const allowed =
    method === "GET"
      ? session ||
        path === "public/businesses" ||
        catalog.test(path) ||
        agenda.test(path)
      : (session && (method === "POST" || method === "DELETE")) ||
        (method === "POST" && booking.test(path));
  if (!liveMode || !allowed) return failure(404, "Recurso não encontrado.");

  const upstream = process.env.BOOKINFY_API_URL;
  const origin = process.env.BOOKINFY_WEB_ORIGIN;
  if (!upstream || !origin)
    return failure(503, "O agendamento está indisponível no momento.");
  if (method !== "GET" && request.headers.get("origin") !== origin) {
    return failure(403, "Origem da solicitação não autorizada.");
  }

  const headers = new Headers({ Accept: "application/json" });
  if (session || agenda.test(path)) {
    const value = request.cookies.get(sessionCookie)?.value;
    if (value && /^[A-Za-z0-9_-]{43}$/.test(value)) {
      headers.set("Cookie", `${sessionCookie}=${value}`);
    }
  }

  let body: Uint8Array<ArrayBuffer> | undefined;
  if (method === "POST") {
    if (
      request.headers
        .get("content-type")
        ?.split(";")[0]
        ?.trim()
        .toLowerCase() !== "application/json"
    ) {
      return failure(415, "Envie os dados como JSON.");
    }
    const reader = request.body?.getReader();
    if (reader) {
      const buffer = new Uint8Array(4096);
      let length = 0;
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        if (length + chunk.value.length > buffer.length) {
          await reader.cancel();
          return failure(413, "A solicitação excede o tamanho permitido.");
        }
        buffer.set(chunk.value, length);
        length += chunk.value.length;
      }
      body = buffer.subarray(0, length);
    }
    headers.set("Content-Type", "application/json");
  }

  try {
    const url = new URL(`/v1/${path}`, upstream);
    url.search = request.nextUrl.search;
    const response = await fetch(url, {
      method,
      headers,
      body,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(12000),
    });
    const outgoing = new Headers({
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    const cookie = response.headers.get("set-cookie");
    if (session && cookie) outgoing.set("Set-Cookie", cookie);
    const retry = response.headers.get("retry-after");
    if (retry) outgoing.set("Retry-After", retry);
    return new Response(response.body, {
      status: response.status,
      headers: outgoing,
    });
  } catch {
    return failure(503, "Não foi possível conectar. Tente novamente.");
  }
}

export { proxy as GET, proxy as POST, proxy as DELETE };
