"use client";

import { IconChevronDown } from "@tabler/icons-react";
import Link from "next/link";
import { BreadcrumbEllipsis } from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface MenuLink {
  label: string;
  href: string;
  /** Marks the page you are already on. */
  current?: boolean;
}

/** The "…" that stands in for earlier levels on narrow screens. */
export function EllipsisMenu({ items }: { items: MenuLink[] }) {
  return (
    // Non-modal: a small navigation menu shouldn't hide the rest of the page (and its skip link) from
    // assistive tech while open, which is what a modal Radix menu does.
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label="Show Earlier Levels"
        className="flex size-7 items-center justify-center rounded-full hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-hidden"
      >
        <BreadcrumbEllipsis />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {items.map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Link href={item.href}>{item.label}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** A chevron beside a crumb that lists alternatives at the same level, e.g. your other places. */
export function SwitcherMenu({
  label,
  items,
  footer,
}: {
  /** Names the menu for assistive tech, e.g. "Switch place". */
  label: string;
  items: MenuLink[];
  footer?: MenuLink;
}) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label={label}
        className="flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-hidden"
      >
        <IconChevronDown aria-hidden="true" className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-48">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        {items.map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Link href={item.href} aria-current={item.current ? "page" : undefined}>
              {item.label}
              {item.current && (
                <span className="ml-auto text-xs text-muted-foreground">Current</span>
              )}
            </Link>
          </DropdownMenuItem>
        ))}
        {footer && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={footer.href}>{footer.label}</Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
