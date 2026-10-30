/**
 * Dismissing the dashboard's alerts banner is remembered in a cookie, so the server can leave the
 * banner out entirely (no flash, no jump). The cookie holds a signature of the alerts that were
 * dismissed, so a new or changed alert brings the banner back: dismissing silences what you have
 * seen, not what comes next.
 */
export const DISMISSED_COOKIE = "wx-alerts-dismissed";
export const DISMISSED_DAYS = 3;

/** A short, stable signature of a set of alerts, from their place and id (order doesn't matter). */
export function alertsSignature(ids: string[]): string {
  let hash = 5381;
  for (const char of [...ids].sort().join("|")) hash = (hash * 33) ^ char.charCodeAt(0);
  return (hash >>> 0).toString(36);
}
