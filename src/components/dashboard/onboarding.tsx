import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getI18n } from "@/lib/i18n/server";
import { OpenSearchButton } from "./open-search-button";

export async function Onboarding() {
  const { t } = await getI18n();
  const text = t.dashboard.onboarding;
  return (
    <div className="rounded-3xl border border-dashed border-border p-6 md:p-8">
      <h3 className="font-heading text-2xl">{text.title}</h3>
      <p className="mt-2 max-w-prose text-muted-foreground">
        {text.before} <strong className="font-medium text-foreground">{text.save}</strong>{" "}
        {text.after}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <OpenSearchButton />
        <Button asChild variant="outline">
          <Link href="/">{text.whatIsobarDoes}</Link>
        </Button>
      </div>
    </div>
  );
}
