"use client";

import { useEffect } from "react";
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
    <main
      id="main"
      className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-start justify-center gap-4 px-4 py-24"
    >
      <p className="label-caps">Something went wrong</p>
      <h1 className="font-display text-5xl md:text-6xl">The forecast didn&apos;t load</h1>
      <p className="max-w-prose text-muted-foreground">
        Our weather provider didn&apos;t respond in time. This is usually temporary.
        {error.digest && (
          <span className="mt-2 block font-mono text-xs">Reference: {error.digest}</span>
        )}
      </p>
      <Button onClick={() => retry()}>Try again</Button>
    </main>
  );
}
