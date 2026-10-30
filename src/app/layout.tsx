import type { Metadata, Viewport } from "next";
import { Outfit, Oxanium } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { SearchHost } from "@/components/search/search-host";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { cn } from "@/lib/utils";

// The app uses exactly two faces, both from the shadcn preset: Outfit for text, Oxanium for headings and data labels.
const oxaniumHeading = Oxanium({ subsets: ["latin"], variable: "--font-heading" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });

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

/**
 * The document and what every page shares: theme, tooltips, toasts, the search palette and the
 * service worker. The sidebar, header and footer belong to the `(app)` route group's layout, so a
 * page outside it (the welcome page) stands alone.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", "font-sans", outfit.variable, oxaniumHeading.variable)}
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
              Skip to Content
            </a>
            {children}
            <SearchHost />
            <Toaster />
            <ServiceWorkerRegister />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
