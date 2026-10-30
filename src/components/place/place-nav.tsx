import Link from "next/link";
import { placeHref } from "@/lib/places";
import { cn } from "@/lib/utils";

const link = "rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent";

/** A place's three views: now and today, the two weeks ahead, and how it compares with normal. */
export function PlaceNav({
  placeKey,
  current,
}: {
  placeKey: string;
  current: "forecast" | "outlook" | "history";
}) {
  const base = placeHref({ key: placeKey });
  return (
    <nav aria-label="Place Sections" className="-ml-3 flex gap-1">
      <Link
        href={base}
        aria-current={current === "forecast" ? "page" : undefined}
        className={cn(link, current === "forecast" && "bg-accent font-medium")}
      >
        Forecast
      </Link>
      <Link
        href={`${base}/outlook`}
        aria-current={current === "outlook" ? "page" : undefined}
        className={cn(link, current === "outlook" && "bg-accent font-medium")}
      >
        Outlook
      </Link>
      <Link
        href={`${base}/history`}
        aria-current={current === "history" ? "page" : undefined}
        className={cn(link, current === "history" && "bg-accent font-medium")}
      >
        Climate
      </Link>
    </nav>
  );
}
