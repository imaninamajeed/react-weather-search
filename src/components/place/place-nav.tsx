import Link from "next/link";
import { placeHref } from "@/lib/places";
import { cn } from "@/lib/utils";

const link = "rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent";

/** Switches between a place's forecast and its climate history. */
export function PlaceNav({
  placeKey,
  current,
}: {
  placeKey: string;
  current: "forecast" | "history";
}) {
  const base = placeHref({ key: placeKey });
  return (
    <nav aria-label="Place sections" className="-ml-3 flex gap-1">
      <Link
        href={base}
        aria-current={current === "forecast" ? "page" : undefined}
        className={cn(link, current === "forecast" && "bg-accent font-medium")}
      >
        Forecast
      </Link>
      <Link
        href={`${base}/history`}
        aria-current={current === "history" ? "page" : undefined}
        className={cn(link, current === "history" && "bg-accent font-medium")}
      >
        Climate history
      </Link>
    </nav>
  );
}
