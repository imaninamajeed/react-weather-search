// Bundles src/sw/sw.ts (with the serwist runtime) into public/sw.js. The worker uses runtime
// caching only, so no build manifest has to be injected and the file can be built before
// `next build`. The only build-specific value is a revision that refreshes the precached offline
// page on every deploy.
import { build } from "esbuild";
import { execSync } from "node:child_process";

function revision() {
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA;
  try {
    return execSync("git rev-parse HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return String(Date.now());
  }
}

await build({
  entryPoints: ["src/sw/sw.ts"],
  outfile: "public/sw.js",
  bundle: true,
  minify: true,
  format: "iife",
  target: "es2020",
  legalComments: "none",
  define: {
    BUILD_REVISION: JSON.stringify(revision()),
    "process.env.NODE_ENV": '"production"',
  },
});
console.log("built public/sw.js");
