import { FAQ, FinalCTA, Plans } from "@/features/marketing/sections";
export const metadata = { title: "Planos e recursos" };
export default function Pricing() {
  return (
    <>
      <Plans />
      <FAQ />
      <FinalCTA />
    </>
  );
}
