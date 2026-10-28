import { Suspense } from "react";
import { ActiveMainNav, MainNavView, type NavVariant } from "./main-nav-client";

/**
 * The app's four destinations. The current path is request-time data, so the prerendered shell
 * contains the links without the highlight and the highlight streams in.
 */
export function MainNav({ variant }: { variant: NavVariant }) {
  return (
    <Suspense fallback={<MainNavView variant={variant} pathname={null} />}>
      <ActiveMainNav variant={variant} />
    </Suspense>
  );
}
