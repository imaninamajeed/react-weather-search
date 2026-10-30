import type { Locale } from "../locales";
import { about } from "./about";
import { alerts } from "./alerts";
import { common } from "./common";
import { dashboard } from "./dashboard";
import { map } from "./map";
import { nav } from "./nav";
import { place } from "./place";
import { search } from "./search";
import { states } from "./states";
import { weather } from "./weather";
import { welcome } from "./welcome";

const areas = {
  common,
  nav,
  states,
  weather,
  dashboard,
  alerts,
  place,
  map,
  search,
  about,
  welcome,
};

type Areas = typeof areas;

function pick<L extends Locale>(locale: L) {
  return Object.fromEntries(Object.entries(areas).map(([name, area]) => [name, area[locale]])) as {
    [K in keyof Areas]: Areas[K]["en"];
  };
}

/** Every string the interface shows, by language. English is the source; Malay is checked against it. */
export const MESSAGES = { en: pick("en"), ms: pick("ms") };

export type Messages = typeof MESSAGES.en;

export const getMessages = (locale: Locale): Messages => MESSAGES[locale];
