import { defineMessages } from "../define";

/** The alerts page, the alert rows and the notes about where alerts come from. */
export const alerts = defineMessages(
  {
    sources: {
      forecast: "Forecast signals",
      "met-malaysia": "MET Malaysia",
      nws: "US National Weather Service",
    },
    note: {
      checked: "Checked:",
      howAlertsWork: "How Alerts Work",
      couldntReach: (sources: string) =>
        `Couldn't reach ${sources}, so official warnings may be missing.`,
      or: " or ",
    },
    badge: {
      oneWarning: "1 Warning",
      oneAdvisory: "1 Advisory",
      many: (count: number) => `${count} Alerts`,
    },
    list: {
      showMore: (count: number) => `Show ${count} more ${count === 1 ? "alert" : "alerts"}`,
    },
    filter: {
      label: "Filter Alerts",
      all: (count: number) => `All Alerts (${count})`,
      official: (count: number) => `Official Warnings (${count})`,
    },
    item: {
      official: (issuer: string) => `Official · ${issuer}`,
      forecastSignal: "Forecast Signal",
      fullNotice: "Full Notice",
      source: (issuer: string) => `Source: ${issuer}`,
    },
    place: {
      none: (name: string) => `No active alerts for ${name}.`,
    },
    summary: {
      label: "Weather Alerts",
      couldntCheck: "Couldn't check alerts",
      allClear: "All clear",
      noneFound: "No alerts found",
      unavailable: "Alerts are unavailable right now. Try again in a moment.",
      noActive: (where: string) => `No active alerts across ${where}.`,
      incomplete:
        "Nothing active in what we could reach, but some checks didn't finish. Details are below.",
      acrossAll: (where: string) => `Across all of ${where}.`,
      inSome: (count: number, where: string) => `In ${count} of ${where}.`,
      yourLocation: "your location",
      yourLocations: (count: number) => `your ${count} locations`,
      warnings: "Warnings",
      advisories: "Advisories",
      locationsChecked: "Locations checked",
    },
    next: {
      button: "Where to next?",
      title: "All clear. Where to next?",
      description: "Nothing needs your attention, so go and see the weather.",
      dashboard: "Home, right now, and the days ahead.",
      places: "Everywhere you follow, side by side.",
      map: "Radar and conditions on the map.",
    },
    reading: {
      title: "Reading Alerts",
      description: "What the labels on each alert mean.",
      warning: "Serious or damaging conditions.",
      advisory: "Worth planning around.",
      officialTerm: "Official",
      official: "Issued by a national weather service.",
      forecastSignal: "Our own check of the forecast against set thresholds.",
    },
    view: {
      noOfficial: "No official warnings right now.",
      noOfficialDetail: "Forecast signals are listed under All alerts.",
      allAlerts: "All Alerts",
      about: "About These Alerts",
      count: (count: number) => `${count} ${count === 1 ? "alert" : "alerts"}`,
    },
  },
  {
    sources: {
      forecast: "Isyarat ramalan",
      "met-malaysia": "MET Malaysia",
      nws: "Perkhidmatan Cuaca Kebangsaan AS",
    },
    note: {
      checked: "Disemak:",
      howAlertsWork: "Cara Makluman Berfungsi",
      couldntReach: (sources) =>
        `Tidak dapat menghubungi ${sources}, jadi amaran rasmi mungkin tiada.`,
      or: " atau ",
    },
    badge: {
      oneWarning: "1 Amaran",
      oneAdvisory: "1 Nasihat",
      many: (count) => `${count} Makluman`,
    },
    list: {
      showMore: (count) => `Tunjukkan ${count} makluman lagi`,
    },
    filter: {
      label: "Tapis Makluman",
      all: (count) => `Semua Makluman (${count})`,
      official: (count) => `Amaran Rasmi (${count})`,
    },
    item: {
      official: (issuer) => `Rasmi · ${issuer}`,
      forecastSignal: "Isyarat Ramalan",
      fullNotice: "Notis Penuh",
      source: (issuer) => `Sumber: ${issuer}`,
    },
    place: {
      none: (name) => `Tiada makluman aktif untuk ${name}.`,
    },
    summary: {
      label: "Makluman Cuaca",
      couldntCheck: "Tidak dapat menyemak makluman",
      allClear: "Semuanya selamat",
      noneFound: "Tiada makluman ditemui",
      unavailable: "Makluman tidak tersedia buat masa ini. Cuba lagi sebentar nanti.",
      noActive: (where) => `Tiada makluman aktif di ${where}.`,
      incomplete:
        "Tiada yang aktif dalam apa yang dapat kami capai, tetapi sebahagian semakan tidak selesai. Butirannya di bawah.",
      acrossAll: (where) => `Di seluruh ${where}.`,
      inSome: (count, where) => `Di ${count} daripada ${where}.`,
      yourLocation: "lokasi anda",
      yourLocations: (count) => `${count} lokasi anda`,
      warnings: "Amaran",
      advisories: "Nasihat",
      locationsChecked: "Lokasi yang disemak",
    },
    next: {
      button: "Seterusnya ke mana?",
      title: "Semuanya selamat. Seterusnya ke mana?",
      description: "Tiada apa yang memerlukan perhatian anda, jadi pergilah melihat cuaca.",
      dashboard: "Rumah, sekarang, dan hari-hari mendatang.",
      places: "Semua tempat yang anda ikuti, bersebelahan.",
      map: "Radar dan keadaan di atas peta.",
    },
    reading: {
      title: "Membaca Makluman",
      description: "Maksud label pada setiap makluman.",
      warning: "Keadaan serius atau merosakkan.",
      advisory: "Wajar dirancang.",
      officialTerm: "Rasmi",
      official: "Dikeluarkan oleh perkhidmatan cuaca kebangsaan.",
      forecastSignal: "Semakan ramalan oleh kami sendiri berdasarkan ambang yang ditetapkan.",
    },
    view: {
      noOfficial: "Tiada amaran rasmi buat masa ini.",
      noOfficialDetail: "Isyarat ramalan disenaraikan di bawah Semua makluman.",
      allAlerts: "Semua Makluman",
      about: "Tentang Makluman Ini",
      count: (count) => `${count} makluman`,
    },
  },
);
