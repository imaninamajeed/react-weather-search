import Image from "next/image";
import Link from "next/link";
import { SearchCommand } from "@/components/search/search-command";

export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Isobar home">
          <Image
            src="/brand/mark.webp"
            alt=""
            width={28}
            height={28}
            className="rounded-md"
            priority
          />
          <span className="font-display text-2xl leading-none">Isobar</span>
        </Link>
        <div className="ml-auto w-full max-w-xs">
          <SearchCommand />
        </div>
      </div>
    </header>
  );
}
