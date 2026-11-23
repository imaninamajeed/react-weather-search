export async function register() {
  // Node-only setup lives in its own module so it is never bundled for the Edge runtime.
  if (process.env.NEXT_RUNTIME === "nodejs") await import("./instrumentation-node");
}
