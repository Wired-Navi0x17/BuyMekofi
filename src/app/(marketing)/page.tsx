import { BurnIntro } from "@/components/marketing/burn-intro";
import { Hero } from "@/components/marketing/hero";
import {
  Faq,
  HowItWorks,
  PaymentRoutes,
  Pricing,
  SiteFooter,
} from "@/components/marketing/sections";
import { getSiteContent } from "@/modules/cms/read";

export default async function LandingPage() {
  // Published CMS content (cached, tag-revalidated on publish); defaults otherwise.
  const [hero, announcement, steps, faq, pricingNote] = await Promise.all([
    getSiteContent("landing.hero"),
    getSiteContent("site.announcement"),
    getSiteContent("landing.steps"),
    getSiteContent("landing.faq"),
    getSiteContent("landing.pricing_note"),
  ]);
  return (
    <>
      <BurnIntro>
        <Hero content={hero} announcement={announcement} />
      </BurnIntro>
      <main id="content" data-intro-inert className="relative bg-paper">
        <HowItWorks content={steps} />
        <PaymentRoutes />
        <Pricing note={pricingNote} />
        <Faq content={faq} />
      </main>
      <SiteFooter />
    </>
  );
}
