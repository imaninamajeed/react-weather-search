"use client";

import Link from "next/link";
import { IsobarMark } from "@/components/shared/isobar-mark";
import { useMessages } from "@/lib/i18n/client";

/** The brand in the phone header, linking home. A client component only so its label can follow the language. */
export function HeaderBrand() {
  const t = useMessages();
  return (
    <Link
      href="/dashboard"
      aria-label={t.nav.isobarHome}
      className="flex shrink-0 items-center gap-2 rounded-md focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-hidden md:hidden"
    >
      <IsobarMark detail="compact" animated className="size-8" />
      <span className="font-heading text-xl leading-none">Isobar</span>
    </Link>
  );
}
