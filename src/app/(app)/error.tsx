"use client";

import { IconCloudOff } from "@tabler/icons-react";
import Link from "next/link";
import { useEffect } from "react";
import { StateScreen } from "@/components/shared/state-screen";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // The digest matches the server-side log entry for this failure.
    console.error(error);
  }, [error]);

  return (
    <StateScreen
      icon={IconCloudOff}
      label="Something Went Wrong"
      title="The Forecast Didn't Load"
      actions={
        <>
          <Button onClick={() => retry()}>Try Again</Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </>
      }
    >
      <p>
        Our weather provider didn&apos;t respond in time. This is usually temporary.
        {error.digest && (
          <span className="mt-2 block font-heading text-xs">Reference: {error.digest}</span>
        )}
      </p>
    </StateScreen>
  );
}
