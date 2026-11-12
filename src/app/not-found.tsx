import { Brand, Credit } from "@/components/layout/brand";
import { ButtonLink } from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <main id="main" className="centered-page">
      <Brand />
      <span className="error-code">404</span>
      <h1>Esse caminho ficou livre.</h1>
      <p>A página que você procura não foi encontrada.</p>
      <ButtonLink href="/">Voltar para o início</ButtonLink>
      <Credit />
    </main>
  );
}
