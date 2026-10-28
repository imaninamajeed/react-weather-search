import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Outfit, Oxanium } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OfflineBanner } from "@/components/pwa/offline-banner";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { SiteFooter } from "@/components/layout/site-footer";
import { MainNav } from "@/components/layout/main-nav";
import { CrumbBar, TopBar } from "@/components/layout/top-bar";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { cn } from "@/lib/utils";

// Body and heading faces come from the shadcn preset; the mono face is for data labels.
const oxaniumHeading = Oxanium({ subsets: ["latin"], variable: "--font-heading" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });

const mono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "Isobar",
  appleWebApp: { capable: true, title: "Isobar", statusBarStyle: "default" },
  title: {
    default: "Isobar — weather, alerts and forecast confidence",
    template: "%s · Isobar",
  },
  description:
    "Forecasts, severe-weather alerts, forecast confidence, 30-year climate comparison and live radar for the places you care about.",
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#090b0c" },
  ],
};

export default function RootLayout({ children, crumbs }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        "font-sans",
        outfit.variable,
        oxaniumHeading.variable,
        mono.variable,
      )}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <a
              href="#main"
              className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
            >
              Skip to content
            </a>
            {/* Room for the bottom tab bar, which only exists below lg. */}
            <div className="flex flex-1 flex-col pb-17 lg:pb-0">
              <OfflineBanner />
              <TopBar />
              <CrumbBar crumbs={crumbs} />
              {children}
              <SiteFooter />
            </div>
            <MainNav variant="tabs" />
            <Toaster />
            <ServiceWorkerRegister />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
