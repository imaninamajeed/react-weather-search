"use client";

import { IconCloudOff } from "@tabler/icons-react";
import Link from "next/link";
import { useEffect } from "react";
import { StateScreen } from "@/components/shared/state-screen";
import { Button } from "@/components/ui/button";
import { useMessages } from "@/lib/i18n/client";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const t = useMessages();
  useEffect(() => {
    // The digest matches the server-side log entry for this failure.
    console.error(error);
  }, [error]);

  return (
    <StateScreen
      icon={IconCloudOff}
      label={t.states.error.label}
      title={t.states.error.title}
      actions={
        <>
          <Button onClick={() => retry()}>{t.common.tryAgain}</Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">{t.states.error.backToDashboard}</Link>
          </Button>
        </>
      }
    >
      <p>
        {t.states.error.body}
        {error.digest && (
          <span className="mt-2 block font-heading text-xs">
            {t.states.reference(error.digest)}
          </span>
        )}
      </p>
    </StateScreen>
  );
}
