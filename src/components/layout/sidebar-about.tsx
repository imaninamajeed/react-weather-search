"use client";

import { IconInfoCircle } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { useMessages } from "@/lib/i18n/client";
import { CURRENT_EDGE } from "./sidebar-nav";

/** About (sources, methods, privacy), highlighted while you are on it. A null pathname shows no highlight. */
export function SidebarAboutView({ pathname }: { pathname: string | null }) {
  const t = useMessages();
  const active = pathname === "/about";
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={active} tooltip={t.nav.about} className={CURRENT_EDGE}>
          <Link href="/about" aria-current={active ? "page" : undefined}>
            <IconInfoCircle aria-hidden="true" />
            <span>{t.nav.about}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function ActiveSidebarAbout() {
  return <SidebarAboutView pathname={usePathname()} />;
}
