import Link from "next/link";
import type { SourceStatus } from "@/lib/alerts/types";
import { getI18n } from "@/lib/i18n/server";

/** Says what was checked, and is explicit when a feed was down so "no alerts" isn't read as "all clear". */
export async function SourceNote({ sources }: { sources: SourceStatus[] }) {
  const { t } = await getI18n();
  const text = t.alerts;
  const label = (source: SourceStatus) => text.sources[source.id];
  const down = sources.filter((source) => source.status === "unavailable");
  return (
    <p className="mt-3 text-xs text-muted-foreground">
      {text.note.checked}{" "}
      {sources
        .filter((s) => s.status === "ok")
        .map(label)
        .join(", ")}
      .{" "}
      <Link
        href="/about#alerts"
        className="underline decoration-border underline-offset-4 hover:text-foreground"
      >
        {text.note.howAlertsWork}
      </Link>
      {down.length > 0 && (
        <span className="ml-1 font-medium text-foreground">
          {text.note.couldntReach(down.map(label).join(text.note.or))}
        </span>
      )}
    </p>
  );
}
