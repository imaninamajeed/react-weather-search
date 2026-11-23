import { defineMessages } from "../define";

/** The search palette (⌘K). */
export const search = defineMessages(
  {
    trigger: "Search Locations",
    placeholder: "Search a city…",
    description: "Search for a city, then press Enter to open its forecast.",
    groups: {
      locations: "Locations",
      recent: "Recent",
      nearby: "Nearby",
      goTo: "Go To",
      appearance: "Appearance",
    },
    useMyLocation: "Use My Location",
    switchToLight: "Switch to Light Theme",
    switchToDark: "Switch to Dark Theme",
    /** A regular expression: typing any of these surfaces the theme command. */
    themeWords: "theme|dark|light|mode|appearance",
    status: {
      noGeolocation: "Your browser doesn't support location lookup.",
      finding: "Finding your location…",
      couldntLocate: "Couldn't get your location. Check your browser's location permission.",
      offline: "You're offline. Search needs a connection.",
      searching: "Searching…",
      unavailable: "Search is unavailable right now. Try again in a moment.",
      noMatch: (query: string) => `No locations match “${query}”.`,
      found: (count: number) => `${count} ${count === 1 ? "location" : "locations"} found.`,
    },
  },
  {
    trigger: "Cari Lokasi",
    placeholder: "Cari sebuah bandar…",
    description: "Cari sebuah bandar, kemudian tekan Enter untuk membuka ramalannya.",
    groups: {
      locations: "Lokasi",
      recent: "Terkini",
      nearby: "Berdekatan",
      goTo: "Pergi Ke",
      appearance: "Paparan",
    },
    useMyLocation: "Gunakan Lokasi Saya",
    switchToLight: "Tukar ke Tema Cerah",
    switchToDark: "Tukar ke Tema Gelap",
    themeWords: "tema|gelap|cerah|mod|paparan|theme|dark|light|mode|appearance",
    status: {
      noGeolocation: "Pelayar anda tidak menyokong carian lokasi.",
      finding: "Mencari lokasi anda…",
      couldntLocate: "Tidak dapat mendapatkan lokasi anda. Semak kebenaran lokasi pelayar anda.",
      offline: "Anda di luar talian. Carian memerlukan sambungan.",
      searching: "Mencari…",
      unavailable: "Carian tidak tersedia buat masa ini. Cuba lagi sebentar nanti.",
      noMatch: (query) => `Tiada lokasi sepadan dengan “${query}”.`,
      found: (count) => `${count} lokasi ditemui.`,
    },
  },
);
