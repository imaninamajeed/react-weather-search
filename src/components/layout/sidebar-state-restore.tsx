"use client";

import { useEffect } from "react";
import { useSidebar } from "@/components/ui/sidebar";

/**
 * The sidebar remembers collapsed/expanded in a cookie, which it expects the *server* to read.
 * Reading cookies in the root layout would make every route dynamic and lose the prerendered
 * shell, so the saved state is applied on the client instead. The cost is a brief expanded
 * flash for visitors who keep it collapsed.
 */
export function SidebarStateRestore() {
  const { setOpen } = useSidebar();
  useEffect(() => {
    if (/(?:^|;\s*)sidebar_state=false(?:;|$)/.test(document.cookie)) setOpen(false);
  }, [setOpen]);
  return null;
}
