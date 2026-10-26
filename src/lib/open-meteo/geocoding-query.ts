// Shared by the server (cache keys) and the search dialog, so it must not import server-only code.

export const MIN_QUERY_LENGTH = 2;
export const MAX_QUERY_LENGTH = 80;

/** Collapses whitespace and clamps length so equivalent queries share a cache entry. */
export function normalizeQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ").slice(0, MAX_QUERY_LENGTH);
}
