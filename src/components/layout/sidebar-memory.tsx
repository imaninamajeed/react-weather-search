"use client";

import { useEffect, useRef } from "react";
import { useSidebar } from "@/components/ui/sidebar";

/**
 * The sidebar writes its open or closed state to a cookie when you toggle it. The layout is
 * prerendered, so it can't read that cookie to start collapsed; this restores it once on arrival.
 */
export function SidebarMemory() {
  const { setOpen } = useSidebar();
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    if (document.cookie.split("; ").includes("sidebar_state=false")) setOpen(false);
  }, [setOpen]);
  return null;
}
