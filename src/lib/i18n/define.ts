/**
 * What a translation must match: every string stays a string, every function keeps its parameters,
 * and every group keeps its keys. Missing or extra keys in Malay are therefore type errors.
 */
export type Translated<T> = {
  [K in keyof T]: T[K] extends (...args: infer Args) => string
    ? (...args: Args) => string
    : T[K] extends string
      ? string
      : Translated<T[K]>;
};

/**
 * One area of the interface in both languages, side by side. English is the source of truth: the
 * Malay copy is checked against its shape. Counts and names go through functions, because word order
 * and plurals differ between the languages.
 */
export function defineMessages<T>(en: T, ms: Translated<T>) {
  return { en, ms };
}
