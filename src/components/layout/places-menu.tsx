"use client";

import { IconChevronDown, IconHome, IconMapPin } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface PlaceOption {
  key: string;
  name: string;
  href: string;
  home: boolean;
}

/** The trigger on its own, as the placeholder while the saved places load. */
export function PlacesMenuButton(props: React.ComponentProps<typeof Button>) {
  return (
    <Button variant="outline" aria-label="Your places" {...props}>
      <IconMapPin aria-hidden="true" />
      <span className="hidden xl:inline">Your places</span>
      <IconChevronDown aria-hidden="true" className="size-3.5 text-muted-foreground" />
    </Button>
  );
}

/** Jump to the home place or any place you follow. Reads the URL, so render it inside <Suspense>. */
export function PlacesMenu({ places, hasSaved }: { places: PlaceOption[]; hasSaved: boolean }) {
  const pathname = usePathname();
  return (
    // Non-modal: a small navigation menu shouldn't hide the rest of the page (and its skip link) from
    // assistive tech while open, which is what a modal Radix menu does.
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <PlacesMenuButton />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuLabel>Your places</DropdownMenuLabel>
        {places.map((place) => {
          const current = pathname === place.href || pathname.startsWith(`${place.href}/`);
          return (
            <DropdownMenuItem key={place.key} asChild>
              <Link href={place.href} aria-current={current ? "page" : undefined}>
                {place.home ? <IconHome aria-hidden="true" /> : <IconMapPin aria-hidden="true" />}
                {place.name}
                {current && <span className="ml-auto text-xs text-muted-foreground">Current</span>}
              </Link>
            </DropdownMenuItem>
          );
        })}
        {!hasSaved && (
          <p className="px-2 py-1.5 text-xs text-muted-foreground">
            Save a place from its forecast page and it appears here.
          </p>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/places">All places</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
