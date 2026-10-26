import type { SourceStatus } from "@/lib/alerts/types";

/** Says what was checked, and is explicit when a feed was down so "no alerts" isn't read as "all clear". */
export function SourceNote({ sources }: { sources: SourceStatus[] }) {
  const down = sources.filter((source) => source.status === "unavailable");
  return (
    <p className="mt-3 text-xs text-muted-foreground">
      Checked:{" "}
      {sources
        .filter((s) => s.status === "ok")
        .map((s) => s.label)
        .join(", ")}
      .
      {down.length > 0 && (
        <span className="ml-1 font-medium text-foreground">
          Couldn&apos;t reach {down.map((s) => s.label).join(" or ")}, so official warnings may be
          missing.
        </span>
      )}
    </p>
  );
}
