import Link from "next/link";
import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import { EllipsisMenu, SwitcherMenu, type MenuLink } from "./crumb-menu";

export interface Crumb {
  label: string;
  /** Omit on the last crumb: it is the current page and isn't a link. */
  href?: string;
  /** Adds a dropdown of alternatives beside the crumb (e.g. switch to another place). */
  switcher?: { label: string; items: MenuLink[]; footer?: MenuLink };
}

/**
 * Where you are in the app, as links back up the hierarchy. On narrow screens everything but the last two
 * levels folds into a "…" dropdown, so the trail never wraps or overflows.
 */
export function PageBreadcrumb({ trail }: { trail: Crumb[] }) {
  const collapsible = trail.length > 3 ? trail.slice(0, -2) : [];
  const isCollapsed = (index: number) => index < collapsible.length;
  const hideOnMobile = "hidden sm:inline-flex";

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {collapsible.length > 0 && (
          <>
            <BreadcrumbItem className="sm:hidden">
              <EllipsisMenu
                items={collapsible.flatMap((crumb) =>
                  crumb.href ? [{ label: crumb.label, href: crumb.href }] : [],
                )}
              />
            </BreadcrumbItem>
            <BreadcrumbSeparator className="sm:hidden" />
          </>
        )}

        {trail.map((crumb, index) => {
          const last = index === trail.length - 1;
          const hidden = isCollapsed(index);
          return (
            <Fragment key={`${crumb.label}-${index}`}>
              <BreadcrumbItem className={cn(hidden && hideOnMobile)}>
                {last || !crumb.href ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
                {crumb.switcher && (
                  <SwitcherMenu
                    label={crumb.switcher.label}
                    items={crumb.switcher.items}
                    footer={crumb.switcher.footer}
                  />
                )}
              </BreadcrumbItem>
              {!last && <BreadcrumbSeparator className={cn(hidden && hideOnMobile)} />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
