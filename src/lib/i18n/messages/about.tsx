import type { ReactNode } from "react";
import { defineMessages } from "../define";

/** Wraps a term for emphasis, supplied by the page so these messages stay free of styling. */
type Emphasis = (text: string) => ReactNode;

/** The About page: prose with a few emphasised terms and links, so some messages return elements. */
export const about = defineMessages(
  {
    label: "About",
    title: "Data and Methods",
    lead: "Where the numbers come from, how alerts and forecast confidence are worked out, and what this app can't tell you.",
    onThisPage: "On This Page",
    sections: {
      sources: "Data Sources",
      alerts: "How Alerts Work",
      confidence: "How Forecast Confidence Works",
      climate: "How Climate History Works",
      privacy: "Privacy",
      limits: "What It Can't Tell You",
      credits: "Credits",
    },
    sources: {
      source: "Source",
      usedFor: "Used For",
      terms: "Terms",
      openMeteo:
        "Forecasts, the three-model comparison (ECMWF, GFS, ICON), air quality, location search and the ERA5 climate record",
      openMeteoTerms: "CC BY 4.0, free for non-commercial use",
      metMalaysia: (link: ReactNode): ReactNode => <>Official warnings for Malaysia, via {link}</>,
      openData: "Open data",
      nws: "Official alerts for US locations",
      nwsTerms: "US government data",
      rainViewer: "Radar images on the map",
      rainViewerTerms: "Free tier: coarse zoom levels and a request limit",
      openFreeMap: "Map tiles",
      openFreeMapTerms: "© OpenMapTiles, data © OpenStreetMap contributors",
    },
    alerts: {
      intro: (strong: Emphasis): ReactNode => (
        <>
          Alerts come in two kinds, and the app always says which one you&apos;re looking at.{" "}
          {strong("Official")} warnings are published by a national weather service (MET Malaysia
          and the US National Weather Service) and are shown first. {strong("Forecast signals")} are
          our own reading of the forecast against the thresholds below. They exist because most
          countries have no feed we can use, but they are not warnings and can be wrong.
        </>
      ),
      matching:
        "Official warnings are matched to a location by name (state and district), so a district-level warning can be missed; the matching is built to miss rather than raise a false alarm. Each official alert links to its issuer for the authoritative text. If a feed can't be reached, the app says so rather than implying there is nothing to report.",
      tableLabel: "Forecast Signal Thresholds",
      hazard: "Hazard",
      advisoryWhen: "Advisory When",
      warningWhen: "Warning When",
      looksAt: "Looks At",
      names: {
        thunderstorms: "Thunderstorms",
        intenseRain: "Intense Rain",
        heavyRain: "Heavy Rain",
        gusts: "Strong Gusts",
        heat: "Heat",
        frost: "Frost",
        snow: "Heavy Snow",
        airQuality: "Air Quality",
      },
      thunderstormAdvisory: (percent: number) =>
        `Thunderstorm forecast with ≥ ${percent}% chance of rain`,
      thunderstormWarning: "Thunderstorm with hail",
      inADay: (amount: string) => `${amount} in a day`,
      heat: (temperature: number, days: number) =>
        `Highs ≥ ${temperature} °C on ${days}+ days in a row`,
      frostLows: (temperature: number) => `Lows ≤ ${temperature} °C`,
      aqi: (value: number) => `US AQI ≥ ${value}`,
      basis: {
        hourly72: "Hourly, next 72 hours",
        daily7: "Daily, next 7 days",
        current: "Current reading",
      },
      note: "Thresholds are shown in metric here; elsewhere the app converts to your units. UV is deliberately not an alert: in the tropics it is very high every day, so it would fire constantly and teach people to ignore alerts. It appears under current conditions instead.",
    },
    confidence: {
      intro:
        "Three independent weather models (ECMWF, GFS and ICON) each forecast the same days. Where they agree the forecast is solid; where they spread apart, the real answer is uncertain.",
      method: (
        strong: Emphasis,
        t: { high: number; medium: number; dry: number; wet: number; gap: number },
      ): ReactNode => (
        <>
          For each day the models&apos; daily highs are compared. Within {t.high} °C of each other
          is {strong("high")} confidence, within {t.medium} °C is {strong("medium")}, and wider is{" "}
          {strong("low")}. The rating drops one more step when the models split on whether it will
          rain at all (under {t.dry} mm against at least {t.wet} mm), or when their rainfall totals
          differ by at least {t.gap} mm and by half of the wettest model&apos;s total. The models
          cover seven days; beyond that, days are marked as indicative only.
        </>
      ),
    },
    climate: {
      intro: (from: string, to: string) =>
        `The climate page compares the last twelve months with what is normal for that location, using ${from}–${to} as the baseline. Both come from the ERA5 reanalysis, pinned to the same dataset on purpose: mixing datasets made recent years look several degrees warmer than they were.`,
      normal:
        "“Normal” for a day is the middle 80% of daily highs on the same calendar day, pooled across a week either side, over the thirty baseline years. Values describe the surrounding area rather than a single station, and the most recent days run a few days behind.",
    },
    privacy: [
      "Your saved locations, home location, units and language are stored in cookies on this device. There are no accounts.",
      "Recent searches are kept in this browser's local storage and never leave it.",
      "Weather requests are made by our server, not your browser, and coordinates are rounded to about a kilometre first.",
      "The map is the exception: tiles and radar images load straight from OpenFreeMap and RainViewer, so they see your IP address like any site you visit.",
      "There are no analytics, advertising or tracking scripts.",
    ],
    limits: [
      "Forecast signals are heuristics, not warnings. For anything safety-critical, rely on your national weather service.",
      "Forecasts are model output on a grid, not a measurement at your door, so local effects such as a single storm cell can differ.",
      "Saved locations don't sync across devices.",
      "Official warnings are only available for Malaysia and the United States so far.",
    ],
    credits: (link: ReactNode): ReactNode => (
      <>
        Isobar grew out of a React weather-search project and is released under the MIT licence.
        Weather data by {link}.
      </>
    ),
  },
  {
    label: "Tentang",
    title: "Data dan Kaedah",
    lead: "Dari mana angka-angka datang, bagaimana makluman dan keyakinan ramalan dikira, dan perkara yang tidak dapat diberitahu oleh aplikasi ini.",
    onThisPage: "Pada Halaman Ini",
    sections: {
      sources: "Sumber Data",
      alerts: "Cara Makluman Berfungsi",
      confidence: "Cara Keyakinan Ramalan Berfungsi",
      climate: "Cara Sejarah Iklim Berfungsi",
      privacy: "Privasi",
      limits: "Perkara yang Tidak Dapat Diberitahu",
      credits: "Penghargaan",
    },
    sources: {
      source: "Sumber",
      usedFor: "Kegunaan",
      terms: "Terma",
      openMeteo:
        "Ramalan, perbandingan tiga model (ECMWF, GFS, ICON), kualiti udara, carian lokasi dan rekod iklim ERA5",
      openMeteoTerms: "CC BY 4.0, percuma untuk kegunaan bukan komersial",
      metMalaysia: (link) => <>Amaran rasmi untuk Malaysia, melalui {link}</>,
      openData: "Data terbuka",
      nws: "Makluman rasmi untuk lokasi di Amerika Syarikat",
      nwsTerms: "Data kerajaan Amerika Syarikat",
      rainViewer: "Imej radar pada peta",
      rainViewerTerms: "Peringkat percuma: aras zum kasar dan had permintaan",
      openFreeMap: "Jubin peta",
      openFreeMapTerms: "© OpenMapTiles, data © penyumbang OpenStreetMap",
    },
    alerts: {
      intro: (strong) => (
        <>
          Makluman terdiri daripada dua jenis, dan aplikasi sentiasa menyatakan yang mana satu
          sedang anda lihat. Amaran {strong("rasmi")} diterbitkan oleh perkhidmatan cuaca kebangsaan
          (MET Malaysia dan Perkhidmatan Cuaca Kebangsaan AS) dan dipaparkan dahulu.{" "}
          {strong("Isyarat ramalan")} ialah bacaan kami sendiri terhadap ramalan berdasarkan ambang
          di bawah. Ia wujud kerana kebanyakan negara tidak mempunyai suapan yang boleh kami
          gunakan, tetapi ia bukan amaran dan boleh jadi salah.
        </>
      ),
      matching:
        "Amaran rasmi dipadankan dengan lokasi menggunakan nama (negeri dan daerah), jadi amaran peringkat daerah mungkin terlepas; pemadanan ini dibina supaya terlepas dan bukannya mencetuskan penggera palsu. Setiap makluman rasmi dipautkan kepada pengeluarnya untuk teks yang sahih. Jika suapan tidak dapat dicapai, aplikasi akan memberitahu dan tidak membayangkan bahawa tiada apa-apa untuk dilaporkan.",
      tableLabel: "Ambang Isyarat Ramalan",
      hazard: "Bahaya",
      advisoryWhen: "Nasihat Apabila",
      warningWhen: "Amaran Apabila",
      looksAt: "Meneliti",
      names: {
        thunderstorms: "Ribut Petir",
        intenseRain: "Hujan Mencurah",
        heavyRain: "Hujan Lebat",
        gusts: "Tiupan Angin Kuat",
        heat: "Cuaca Panas",
        frost: "Fros",
        snow: "Salji Lebat",
        airQuality: "Kualiti Udara",
      },
      thunderstormAdvisory: (percent) =>
        `Ramalan ribut petir dengan kemungkinan hujan ≥ ${percent}%`,
      thunderstormWarning: "Ribut petir dengan hujan batu",
      inADay: (amount) => `${amount} sehari`,
      heat: (temperature, days) =>
        `Suhu tertinggi ≥ ${temperature} °C selama ${days}+ hari berturut-turut`,
      frostLows: (temperature) => `Suhu terendah ≤ ${temperature} °C`,
      aqi: (value) => `AQI AS ≥ ${value}`,
      basis: {
        hourly72: "Setiap jam, 72 jam seterusnya",
        daily7: "Setiap hari, 7 hari seterusnya",
        current: "Bacaan semasa",
      },
      note: "Ambang ditunjukkan dalam metrik di sini; di tempat lain aplikasi menukarnya kepada unit anda. UV sengaja tidak dijadikan makluman: di kawasan tropika ia sangat tinggi setiap hari, jadi ia akan tercetus sentiasa dan mengajar orang mengabaikan makluman. Ia dipaparkan di bawah keadaan semasa.",
    },
    confidence: {
      intro:
        "Tiga model cuaca bebas (ECMWF, GFS dan ICON) masing-masing meramal hari yang sama. Apabila ia sependapat, ramalan itu kukuh; apabila ia berbeza, jawapan sebenar tidak pasti.",
      method: (strong, t) => (
        <>
          Bagi setiap hari, suhu tertinggi harian model dibandingkan. Dalam lingkungan {t.high} °C
          antara satu sama lain ialah keyakinan {strong("tinggi")}, dalam {t.medium} °C ialah{" "}
          {strong("sederhana")}, dan lebih besar ialah {strong("rendah")}. Penilaian turun satu
          tahap lagi apabila model berbelah bahagi sama ada hujan akan turun atau tidak (kurang
          daripada {t.dry} mm berbanding sekurang-kurangnya {t.wet} mm), atau apabila jumlah hujan
          mereka berbeza sekurang-kurangnya {t.gap} mm dan separuh daripada jumlah model paling
          basah. Model meliputi tujuh hari; selepas itu, hari ditandakan sebagai petunjuk sahaja.
        </>
      ),
    },
    climate: {
      intro: (from, to) =>
        `Halaman iklim membandingkan dua belas bulan lalu dengan apa yang normal bagi lokasi itu, menggunakan ${from}–${to} sebagai garis dasar. Kedua-duanya datang daripada analisis semula ERA5, sengaja dikunci pada set data yang sama: mencampurkan set data menjadikan tahun-tahun terkini kelihatan beberapa darjah lebih panas daripada sebenarnya.`,
      normal:
        "“Normal” bagi sesuatu hari ialah 80% tengah suhu tertinggi harian pada hari kalendar yang sama, dikumpulkan merentasi seminggu di kedua-dua belah, sepanjang tiga puluh tahun garis dasar. Nilai menggambarkan kawasan sekitar dan bukan satu stesen, dan hari-hari terkini ketinggalan beberapa hari.",
    },
    privacy: [
      "Lokasi tersimpan, lokasi rumah, unit dan bahasa anda disimpan dalam kuki pada peranti ini. Tiada akaun.",
      "Carian terkini disimpan dalam storan setempat pelayar ini dan tidak pernah keluar daripadanya.",
      "Permintaan cuaca dibuat oleh pelayan kami, bukan pelayar anda, dan koordinat dibundarkan kepada kira-kira satu kilometer terlebih dahulu.",
      "Peta ialah pengecualian: jubin dan imej radar dimuatkan terus daripada OpenFreeMap dan RainViewer, jadi mereka melihat alamat IP anda seperti mana-mana laman yang anda lawati.",
      "Tiada skrip analitik, pengiklanan atau penjejakan.",
    ],
    limits: [
      "Isyarat ramalan ialah heuristik, bukan amaran. Untuk apa-apa yang kritikal dari segi keselamatan, bergantunglah kepada perkhidmatan cuaca kebangsaan anda.",
      "Ramalan ialah output model pada grid, bukan ukuran di depan pintu anda, jadi kesan setempat seperti satu sel ribut boleh berbeza.",
      "Lokasi tersimpan tidak disegerakkan merentasi peranti.",
      "Amaran rasmi hanya tersedia untuk Malaysia dan Amerika Syarikat buat masa ini.",
    ],
    credits: (link) => (
      <>
        Isobar berkembang daripada projek carian cuaca React dan dikeluarkan di bawah lesen MIT.
        Data cuaca daripada {link}.
      </>
    ),
  },
);
