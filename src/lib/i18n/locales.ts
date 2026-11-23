/** The languages the app is written in. English is the default and the fallback for anything else. */
export const LOCALES = ["en", "ms"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Not httpOnly, so the browser can read the language without a round trip (see i18n/client). */
export const LOCALE_COOKIE = "lang";

/** Each language in its own words, so a visitor can always find theirs. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  ms: "Bahasa Melayu",
};

/** BCP 47 tags for `Intl` and the `lang` attribute. */
export const INTL_TAGS: Record<Locale, string> = {
  en: "en-US",
  ms: "ms-MY",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** The cookie is user-controlled input: anything unrecognised is the default language. */
export function parseLocale(value: string | null | undefined): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
