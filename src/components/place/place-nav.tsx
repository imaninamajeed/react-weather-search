import Link from "next/link";
import { getI18n } from "@/lib/i18n/server";
import { placeHref } from "@/lib/places";
import { cn } from "@/lib/utils";

const link = "rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent";

/** A place's three views: now and today, the two weeks ahead, and how it compares with normal. */
export async function PlaceNav({
  placeKey,
  current,
}: {
  placeKey: string;
  current: "forecast" | "outlook" | "history";
}) {
  const { t } = await getI18n();
  const base = placeHref({ key: placeKey });
  return (
    <nav aria-label={t.place.nav.sections} className="-ml-3 flex gap-1">
      <Link
        href={base}
        aria-current={current === "forecast" ? "page" : undefined}
        className={cn(link, current === "forecast" && "bg-accent font-medium")}
      >
        {t.nav.forecast}
      </Link>
      <Link
        href={`${base}/outlook`}
        aria-current={current === "outlook" ? "page" : undefined}
        className={cn(link, current === "outlook" && "bg-accent font-medium")}
      >
        {t.nav.outlook}
      </Link>
      <Link
        href={`${base}/history`}
        aria-current={current === "history" ? "page" : undefined}
        className={cn(link, current === "history" && "bg-accent font-medium")}
      >
        {t.nav.climate}
      </Link>
    </nav>
  );
}
