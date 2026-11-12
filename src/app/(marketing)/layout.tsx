import {
  MarketingFooter,
  MarketingHeader,
} from "@/components/layout/marketing-shell";
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MarketingHeader />
      <main id="main">{children}</main>
      <MarketingFooter />
    </>
  );
}
