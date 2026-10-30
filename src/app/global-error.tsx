"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary: it replaces the root layout, so it can't rely on the app's CSS, fonts or
 * components. Styles are inline for that reason.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          fontFamily: "system-ui, sans-serif",
          background: "#f7f6f1",
          color: "#1b2230",
        }}
      >
        <main style={{ maxWidth: "32rem" }}>
          <h1 style={{ fontSize: "2rem", margin: "0 0 0.5rem" }}>Something Went Wrong</h1>
          <p style={{ margin: "0 0 1.5rem", lineHeight: 1.5 }}>
            Isobar hit an unexpected error. Trying again usually fixes it.
            {error.digest ? ` (Reference: ${error.digest})` : ""}
          </p>
          <button
            onClick={() => retry()}
            style={{
              font: "inherit",
              padding: "0.6rem 1.1rem",
              border: 0,
              borderRadius: 6,
              background: "#0f5c5e",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </main>
      </body>
    </html>
  );
}
