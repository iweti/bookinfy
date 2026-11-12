import {
  BusinessStrip,
  Features,
  FinalCTA,
  Growth,
  SubpageHero,
} from "@/features/marketing/sections";
export const metadata = { title: "Soluções" };
export default function Solutions() {
  return (
    <>
      <SubpageHero
        eyebrow="DO SEU JEITO. NO SEU RITMO."
        title="As partes da sua rotina."
        accent="Uma experiência conectada."
        description="Agendamento, pessoas e indicadores em um lugar pensado para quem cuida."
      />
      <Features />
      <Growth />
      <BusinessStrip />
      <FinalCTA />
    </>
  );
}
