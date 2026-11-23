"use client";

import Link from "next/link";
import { IsobarMark } from "@/components/shared/isobar-mark";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useMessages } from "@/lib/i18n/client";

/** The brand, linking home. A client component only so its label can follow the language. */
export function SidebarBrand() {
  const t = useMessages();
  return (
    <SidebarMenuButton asChild size="lg" tooltip="Isobar">
      <Link href="/dashboard" aria-label={t.nav.isobarHome}>
        <IsobarMark detail="compact" animated className="size-8!" />
        <span className="font-heading text-2xl leading-none">Isobar</span>
      </Link>
    </SidebarMenuButton>
  );
}
