import "server-only";
import { cookies, headers } from "next/headers";
import {
  defaultUnitsFor,
  parsePreferences,
  serializePreferences,
  type Preferences,
} from "@/lib/preferences-core";

const COOKIE = "wx";
const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Reads the visitor's preferences. This touches request data, so callers must sit
 * inside a <Suspense> boundary.
 *
 * The cookie is deliberately not signed: it only holds the visitor's own non-sensitive
 * settings, so tampering can only change their own view, and signing would add a
 * required secret for no security gain. Everything read from it is validated anyway.
 */
export async function getPreferences(): Promise<Preferences> {
  const raw = (await cookies()).get(COOKIE)?.value;
  // First visit: guess units from the browser language, then remember once they choose.
  const acceptLanguage = raw ? null : (await headers()).get("accept-language");
  return parsePreferences(raw, defaultUnitsFor(acceptLanguage));
}

export async function writePreferences(preferences: Preferences): Promise<void> {
  (await cookies()).set(COOKIE, serializePreferences(preferences), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR,
  });
}
