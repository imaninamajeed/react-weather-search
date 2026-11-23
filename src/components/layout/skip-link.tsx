"use client";

import { useMessages } from "@/lib/i18n/client";

/** The first stop for a keyboard: straight past the navigation to the page. */
export function SkipLink() {
  const t = useMessages();
  return (
    <a
      href="#main"
      className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
    >
      {t.common.skipToContent}
    </a>
  );
}
