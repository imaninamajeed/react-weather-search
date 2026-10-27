import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main
      id="main"
      className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-start justify-center gap-4 px-4 py-24"
    >
      <p className="label-caps">404</p>
      <h1 className="font-heading text-5xl md:text-6xl">We couldn&apos;t find that place</h1>
      <p className="max-w-prose text-muted-foreground">
        The link may be out of date, or the place may not exist. Use the search above to find a
        city, or head back to your dashboard.
      </p>
      <Button asChild>
        <Link href="/">Back to dashboard</Link>
      </Button>
    </main>
  );
}
