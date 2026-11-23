import Link from "next/link";
import { getI18n } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

/** All alerts, or only the official warnings: two links that look like one segmented control. */
export async function AlertsFilter({
  totalAll,
  totalOfficial,
  officialOnly,
}: {
  totalAll: number;
  totalOfficial: number;
  officialOnly: boolean;
}) {
  const { t } = await getI18n();
  const options = [
    { href: "/alerts", label: t.alerts.filter.all(totalAll), active: !officialOnly },
    {
      href: "/alerts?show=official",
      label: t.alerts.filter.official(totalOfficial),
      active: officialOnly,
    },
  ];

  return (
    <nav
      aria-label={t.alerts.filter.label}
      className="inline-flex max-w-full flex-wrap gap-1 self-start rounded-full bg-muted p-1"
    >
      {options.map(({ href, label, active }) => (
        <Link
          key={href}
          href={href}
          aria-current={active ? "page" : undefined}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            active
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
