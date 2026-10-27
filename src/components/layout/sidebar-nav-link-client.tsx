"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";

export interface NavLinkProps {
  href: string;
  /** Rendered as an element (not a component) so it can cross the server/client boundary. */
  icon: ReactNode;
  /** Match only this exact path, instead of this path and everything below it. */
  exact?: boolean;
  children: ReactNode;
}

/** The link itself. Closes the mobile drawer on navigation. */
export function NavLinkView({
  href,
  icon,
  active,
  children,
}: Omit<NavLinkProps, "exact"> & { active: boolean }) {
  const { setOpenMobile } = useSidebar();
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={active}
        tooltip={typeof children === "string" ? children : undefined}
      >
        <Link
          href={href}
          aria-current={active ? "page" : undefined}
          onClick={() => setOpenMobile(false)}
        >
          {icon}
          <span>{children}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

/** Reads the URL, which is request-time data, so it must render inside <Suspense> (see SidebarNavLink). */
export function ActiveNavLink({ href, exact = false, ...rest }: NavLinkProps) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return <NavLinkView href={href} active={active} {...rest} />;
}
