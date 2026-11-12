import {
  BusinessStrip,
  FAQ,
  Features,
  FinalCTA,
  Growth,
  Hero,
  Plans,
  Workflow,
} from "@/features/marketing/sections";
export default function Home() {
  return (
    <>
      <Hero />
      <BusinessStrip />
      <Features />
      <Workflow />
      <Growth />
      <Plans />
      <FAQ />
      <FinalCTA />
    </>
  );
}
