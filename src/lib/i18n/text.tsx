"use client";

import type { ReactNode } from "react";
import { useMessages } from "./client";
import type { Messages } from "./messages";

type Leaves<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : T[K] extends (...args: never[]) => unknown
      ? never
      : T[K] extends readonly unknown[]
        ? never
        : Leaves<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

/** The path of a plain string in the messages, e.g. "nav.dashboard". */
export type MessageId = Leaves<Messages>;

/**
 * A piece of interface text for a server component in the prerendered shell, which cannot know the
 * visitor's language: the browser fills in the right one. Where the component can read the language
 * itself (it sits inside a <Suspense> boundary), use getTranslations instead.
 */
export function Text({ id }: { id: MessageId }): ReactNode {
  const messages: unknown = useMessages();
  const value = id.split(".").reduce<unknown>((node, key) => (node as never)?.[key], messages);
  return typeof value === "string" ? value : id;
}
