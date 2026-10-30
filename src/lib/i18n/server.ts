import "server-only";
import { cookies } from "next/headers";
import { getMessages, type Messages } from "./messages";
import { LOCALE_COOKIE, parseLocale, type Locale } from "./locales";

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * The visitor's language. This reads the request's cookies, so callers must sit inside a
 * <Suspense> boundary, like getPreferences.
 */
export async function getLocale(): Promise<Locale> {
  return parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);
}

/** The language and its interface text together, for components that also format dates and conditions. */
export async function getI18n(): Promise<{ locale: Locale; t: Messages }> {
  const locale = await getLocale();
  return { locale, t: getMessages(locale) };
}

/** The interface text for the visitor's language (see getLocale for where it may be called). */
export async function getTranslations(): Promise<Messages> {
  return getMessages(await getLocale());
}

export async function writeLocale(locale: Locale): Promise<void> {
  (await cookies()).set(LOCALE_COOKIE, locale, {
    // Read by the browser as well (see i18n/client), and it holds nothing private.
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR,
  });
}
