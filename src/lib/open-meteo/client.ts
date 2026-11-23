import "server-only";
import type { z } from "zod";

/** An upstream API failed, timed out, or returned something we don't understand. */
export class UpstreamError extends Error {
  constructor(
    message: string,
    readonly source: string,
    readonly status?: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "UpstreamError";
  }
}

type Service = "forecast" | "archive" | "air-quality" | "geocoding";

const HOSTS: Record<Service, string> = {
  forecast: "api.open-meteo.com",
  archive: "archive-api.open-meteo.com",
  "air-quality": "air-quality-api.open-meteo.com",
  geocoding: "geocoding-api.open-meteo.com",
};

/**
 * Builds an Open-Meteo URL. With OPEN_METEO_API_KEY set, requests go to the
 * commercial `customer-*` hosts (required for commercial use of the data).
 */
export function openMeteoUrl(
  service: Service,
  path: string,
  params: Record<string, string | number | undefined>,
): URL {
  const apiKey = process.env.OPEN_METEO_API_KEY;
  const host = apiKey ? `customer-${HOSTS[service]}` : HOSTS[service];
  const url = new URL(`https://${host}${path}`);
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(name, String(value));
  }
  if (apiKey) url.searchParams.set("apikey", apiKey);
  return url;
}

interface FetchJsonOptions {
  /** Shown in errors and logs, e.g. "open-meteo/forecast". */
  source: string;
  timeoutMs?: number;
  /** Extra attempts after the first; only network errors, timeouts, 429 and 5xx are retried. */
  retries?: number;
  headers?: Record<string, string>;
}

const RETRYABLE = (status: number) => status === 429 || status >= 500;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Fetches JSON with a timeout and one retry, and validates it against `schema`. */
export async function fetchJson<T>(
  url: URL | string,
  schema: z.ZodType<T>,
  { source, timeoutMs = 6000, retries = 1, headers }: FetchJsonOptions,
): Promise<T> {
  let lastError: UpstreamError | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) await sleep(250 * attempt);

    let response: Response;
    try {
      response = await fetch(url, {
        headers: { accept: "application/json", ...headers },
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (cause) {
      const timedOut = cause instanceof Error && cause.name === "TimeoutError";
      lastError = new UpstreamError(
        timedOut ? `${source} timed out after ${timeoutMs}ms` : `${source} is unreachable`,
        source,
        undefined,
        { cause },
      );
      continue;
    }

    if (!response.ok) {
      const reason = await readReason(response);
      lastError = new UpstreamError(
        `${source} responded ${response.status}${reason ? `: ${reason}` : ""}`,
        source,
        response.status,
      );
      if (RETRYABLE(response.status)) continue;
      throw lastError;
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch (cause) {
      throw new UpstreamError(`${source} returned invalid JSON`, source, response.status, {
        cause,
      });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new UpstreamError(`${source} returned an unexpected shape`, source, response.status, {
        cause: parsed.error,
      });
    }
    return parsed.data;
  }

  throw lastError ?? new UpstreamError(`${source} failed`, source);
}

async function readReason(response: Response): Promise<string | undefined> {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object" && "reason" in body && typeof body.reason === "string") {
      return body.reason;
    }
  } catch {
    // Body wasn't JSON; the status code alone has to do.
  }
  return undefined;
}
