import Link from "next/link";
import { NoPlacesArt } from "@/components/shared/illustrations";
import { Button } from "@/components/ui/button";
import { getI18n } from "@/lib/i18n/server";
import { OpenSearchButton } from "./open-search-button";

export async function Onboarding() {
  const { t } = await getI18n();
  const text = t.dashboard.onboarding;
  return (
    <div className="flex flex-col gap-6 rounded-3xl bg-muted/50 p-6 sm:flex-row sm:items-center md:p-8">
      <NoPlacesArt className="h-28 self-start sm:h-32 sm:self-center" />
      <div>
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
    </div>
  );
}
