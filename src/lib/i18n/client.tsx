"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getMessages, type Messages } from "./messages";
import { DEFAULT_LOCALE, INTL_TAGS, LOCALE_COOKIE, parseLocale, type Locale } from "./locales";

/*
 * The language lives in a cookie the browser can read. The layout is prerendered, so it cannot know
 * the visitor's language: the shell is written in English and the browser swaps in the saved language
 * once it has loaded (useSyncExternalStore serves English to the server and the cookie's value to the
 * client, so hydration never mismatches). Parts that stream in from the server read the same cookie.
 */

const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};

function readCookie(): Locale {
  const entry = document.cookie.split("; ").find((part) => part.startsWith(`${LOCALE_COOKIE}=`));
  return parseLocale(entry?.slice(LOCALE_COOKIE.length + 1));
}

/** Tells every mounted component that the cookie changed. Call it after the language is saved. */
export function announceLocale() {
  for (const listener of listeners) listener();
}

export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, readCookie, () => DEFAULT_LOCALE);
}

/** The interface text in the visitor's language: `const t = useMessages(); t.nav.dashboard`. */
export function useMessages(): Messages {
  return getMessages(useLocale());
}

/** Keeps the document's `lang` (screen readers' pronunciation, hyphenation) in step with the language. */
export function DocumentLanguage() {
  const locale = useLocale();
  useEffect(() => {
    document.documentElement.lang = INTL_TAGS[locale];
  }, [locale]);
  return null;
}
