import { HeroSection } from "../components/HeroSection";
import { StatsSection } from "../components/StatsSection";
import { PartnersSection } from "../components/PartnersSection";
// import { AnnouncementsSection } from "../components/AnnouncementsSection";
import { CTASection } from "../components/CTASection";


export function HomePage() {
  return (
    <main className="pt-20">
      <HeroSection />
      {/* <AnnouncementsSection /> */}
      <CTASection />
     
      <StatsSection />
      <PartnersSection />
    </main>
  );
}
