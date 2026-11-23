// MapLibre finds its web worker relative to its own module URL, which bundlers rewrite, so the
// worker 404s. Serving the (self-contained) worker file from /public and pointing MapLibre at it
// with setWorkerUrl() is the supported fix. Copying at build time keeps it in step with the
// installed version instead of vendoring a 500 KB file into git.
import { copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const source = join(process.cwd(), "node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs");
const target = join(process.cwd(), "public/maplibre-gl-worker.mjs");

mkdirSync(join(process.cwd(), "public"), { recursive: true });
copyFileSync(source, target);
console.log("copied maplibre-gl-worker.mjs to public/");
