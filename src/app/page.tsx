import type { Metadata } from "next";
import { WelcomeHero } from "@/components/welcome/welcome-hero";

export const metadata: Metadata = {
  description:
    "What Isobar does: forecasts, severe-weather alerts, forecast confidence, climate history and live radar for the locations you follow, with no account.",
};

/** The landing page at `/`. Outside the `(app)` route group on purpose: no sidebar, header or footer. */
export default function WelcomePage() {
  return (
    <main id="main" className="flex min-h-dvh flex-1 flex-col">
      <WelcomeHero />
    </main>
  );
}
