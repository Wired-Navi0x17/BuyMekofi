import { BurnIntro } from "@/components/marketing/burn-intro";
import { Hero } from "@/components/marketing/hero";
import {
  Faq,
  HowItWorks,
  PaymentRoutes,
  Pricing,
  SiteFooter,
} from "@/components/marketing/sections";

export default function LandingPage() {
  return (
    <>
      <BurnIntro>
        <Hero />
      </BurnIntro>
      <main id="content" data-intro-inert className="relative bg-paper">
        <HowItWorks />
        <PaymentRoutes />
        <Pricing />
        <Faq />
      </main>
      <SiteFooter />
    </>
  );
}
