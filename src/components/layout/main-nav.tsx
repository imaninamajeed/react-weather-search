import { Suspense } from "react";
import { ActiveMainNav, MainNavView } from "./main-nav-client";

/**
 * The app's four destinations as a bottom tab bar on phones. The current path is request-time data,
 * so the prerendered shell contains the links without the highlight and the highlight streams in.
 */
export function MainNav() {
  return (
    <Suspense fallback={<MainNavView pathname={null} />}>
      <ActiveMainNav />
    </Suspense>
  );
}
