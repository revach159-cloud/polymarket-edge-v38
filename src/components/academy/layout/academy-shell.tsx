import { AcademyFooter } from "@/components/academy/layout/academy-footer";
import { AcademyHeader } from "@/components/academy/layout/academy-header";
import { SimulationBanner } from "@/components/academy/layout/simulation-banner";

export function AcademyShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="academy-root flex min-h-full flex-1 flex-col">
      <SimulationBanner />
      <AcademyHeader />
      <main id="main-content" className="academy-main flex-1">
        {children}
      </main>
      <AcademyFooter />
    </div>
  );
}
