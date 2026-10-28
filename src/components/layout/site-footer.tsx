import Link from "next/link";

const linkClass = "underline decoration-border underline-offset-4 hover:text-foreground";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:justify-between">
        <p>
          Weather data by{" "}
          <a
            href="https://open-meteo.com/"
            className={linkClass}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open-Meteo.com
          </a>{" "}
          (CC BY 4.0).{" "}
          <Link href="/about" className={linkClass}>
            About this data
          </Link>
        </p>
        <p>
          Built by{" "}
          <a
            href="https://www.linkedin.com/in/imaninamajeed/"
            className={linkClass}
            target="_blank"
            rel="noopener noreferrer"
          >
            Imanina
          </a>
          {" · "}
          <a
            href="https://github.com/imaninamajeed"
            className={linkClass}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </p>
      </div>
    </footer>
  );
}
