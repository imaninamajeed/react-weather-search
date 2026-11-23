"use client";

import { IconMapPinOff, IconWifiOff } from "@tabler/icons-react";
import Link from "next/link";
import { OpenSearchButton } from "@/components/dashboard/open-search-button";
import { StateScreen } from "@/components/shared/state-screen";
import { Button } from "@/components/ui/button";
import { useMessages } from "@/lib/i18n/client";

/** The not-found and offline pages' content. Both are prerendered, so the language is filled in by the browser. */
export function NotFoundState() {
  const t = useMessages();
  return (
    <StateScreen
      icon={IconMapPinOff}
      label="404"
      title={t.states.notFound.title}
      actions={
        <>
          <OpenSearchButton label={t.states.notFound.search} />
          <Button asChild variant="outline">
            <Link href="/dashboard">{t.states.error.backToDashboard}</Link>
          </Button>
        </>
      }
    >
      <p>{t.states.notFound.body}</p>
    </StateScreen>
  );
}

export function OfflineState() {
  const t = useMessages();
  return (
    <StateScreen
      icon={IconWifiOff}
      label={t.states.offline.label}
      title={t.states.offline.title}
      actions={
        <Button asChild>
          <Link href="/dashboard">{t.states.offline.back}</Link>
        </Button>
      }
    >
      <p>{t.states.offline.body}</p>
    </StateScreen>
  );
}
