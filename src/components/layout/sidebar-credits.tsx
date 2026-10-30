"use client";

import { useMessages } from "@/lib/i18n/client";

const linkClass =
  "underline decoration-sidebar-border underline-offset-4 hover:text-sidebar-foreground";

/** Attribution and credit, which the icon rail has no room for. */
export function SidebarCredits() {
  const t = useMessages();
  return (
    <div className="space-y-1 px-2 pb-1 text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
      <p>
        {t.nav.weatherDataBy}{" "}
        <a
          href="https://open-meteo.com/"
          className={linkClass}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open-Meteo.com
        </a>{" "}
        (CC BY 4.0)
      </p>
      <p>
        {t.nav.builtBy}{" "}
        <a
          href="https://www.linkedin.com/in/imaninamajeed/"
          className={linkClass}
          target="_blank"
          rel="noopener noreferrer"
        >
          Imanina
        </a>
        {" · "}
        <a
          href="https://github.com/imaninamajeed"
          className={linkClass}
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </p>
    </div>
  );
}
