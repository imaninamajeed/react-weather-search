import { Suspense } from "react";
import { ActiveNavLink, NavLinkView, type NavLinkProps } from "./sidebar-nav-link-client";

/**
 * A sidebar link that highlights itself on its own route. The current path is request-time data,
 * so the prerendered shell contains the link without the highlight and the highlight streams in.
 */
export function SidebarNavLink(props: NavLinkProps) {
  return (
    <Suspense
      fallback={
        <NavLinkView href={props.href} icon={props.icon} active={false}>
          {props.children}
        </NavLinkView>
      }
    >
      <ActiveNavLink {...props} />
    </Suspense>
  );
}
