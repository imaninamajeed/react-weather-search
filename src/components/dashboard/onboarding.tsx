import { OpenSearchButton } from "./open-search-button";

export function Onboarding() {
  return (
    <div className="rounded-lg border border-dashed border-border p-6 md:p-8">
      <h3 className="font-heading text-2xl">Nothing saved yet</h3>
      <p className="mt-2 max-w-prose text-muted-foreground">
        Subang Jaya stays as your home until you choose another. Search for a city and press{" "}
        <strong className="font-medium text-foreground">Save</strong> to track it here, with a
        week-ahead comparison across all your places. Everything is stored on this device, so
        there&apos;s no account to create.
      </p>
      <div className="mt-5">
        <OpenSearchButton />
      </div>
    </div>
  );
}
