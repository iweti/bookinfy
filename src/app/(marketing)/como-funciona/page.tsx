import {
  FAQ,
  FinalCTA,
  SubpageHero,
  Workflow,
} from "@/features/marketing/sections";
export const metadata = { title: "Como funciona" };
export default function HowItWorks() {
  return (
    <>
      <SubpageHero
        eyebrow="DO PRIMEIRO CLIQUE AO ATENDIMENTO"
        title="Simples para quem agenda."
        accent="Leve para quem cuida."
        description="Conheça a jornada do cliente e acompanhe o resultado no painel de gestão."
      />
      <Workflow />
      <FAQ />
      <FinalCTA />
    </>
  );
}
