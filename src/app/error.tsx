"use client";

import { Button } from "@/components/ui/primitives";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main" className="centered-page">
      <h1>Vamos tentar de novo?</h1>
      <p>Não foi possível carregar esta tela agora.</p>
      <Button onClick={reset}>Tentar novamente</Button>
    </main>
  );
}
