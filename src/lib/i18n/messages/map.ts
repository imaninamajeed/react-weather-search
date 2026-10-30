import { defineMessages } from "../define";

/** The radar map page. */
export const map = defineMessages(
  {
    label: "Live Radar",
    lead: "Rain radar for the last two hours, with the locations you follow. Click anywhere for the weather at that spot.",
    backToPlace: (name: string) => `${name} forecast`,
    center: "Center the Map",
    banner: {
      title: "Last 2 Hours",
      locations: "Locations",
    },
    reading: {
      title: "Reading the Map",
      description: "What the colours, pills and controls on the radar mean.",
      rainTerm: "Radar Colours",
      rain: "Colour shows how hard it is raining: pale blue is light, and deeper, warmer colours are heavier. Snow is drawn in its own colours.",
      timelineTerm: "Timeline",
      timeline:
        "Play steps through the last two hours, oldest first. Drag the slider to stop on one moment; the caption says how long before the latest frame it is.",
      homeTerm: "Home",
      home: "Your home location, marked with a house. Point at it for its weather; click to zoom in and keep the pop-up open.",
      savedTerm: "Saved Locations",
      saved:
        "The other locations you follow, marked with a pin. Point at one for the weather now and a link to its forecast; click to zoom in and keep the pop-up open.",
      centerTerm: "Center Button",
      center:
        "Under the zoom buttons: returns the map to your locations, or to the place you opened it from, and closes any pop-up.",
      clickTerm: "Anywhere Else",
      click:
        "Click any spot for the weather there: the temperature, what it feels like, wind and the chance of rain.",
      areaTerm: "Zoomed In on a Place",
      area: "Close in, a place's pin gives way to a dashed ring about 6 km around it. It is a guide to the surroundings, not the city limit.",
      zoomTerm: "Zoomed In Close",
      zoom: "The radar looks blocky up close because it is scaled up from coarser data. It shows where rain is, not exactly which street.",
    },
    popup: {
      loading: "Loading weather…",
      failed: "Couldn't load the weather here. Try again in a moment.",
      feels: (condition: string, temperature: string) => `${condition} · feels ${temperature}`,
      windRain: (speed: string, percent: number) => `Wind ${speed} · Rain ${percent}%`,
      openForecast: "Open Forecast →",
    },
    region:
      "Weather map. Saved locations are links; click anywhere else for the weather at that spot.",
    mapFailed:
      "The map couldn't load. This usually means your browser has WebGL turned off, or the map provider is unreachable. Your locations are still available from the dashboard.",
    radar: {
      pause: "Pause Radar Animation",
      play: "Play Radar Animation",
      time: "Radar Time",
      latestFrame: "Latest frame",
      minutesBefore: (minutes: number) => `${minutes} minutes before the latest frame`,
      caption: (frame: string) => `Radar · ${frame}`,
      latest: "(latest)",
      earlier: (minutes: number) => `(${minutes} min earlier)`,
      opacity: "Radar Opacity",
      percent: (value: number) => `${value} percent`,
      opacityCaption: (value: number) => `Radar Opacity · ${value}%`,
      unavailable: "Rain radar is unavailable right now. The map and your locations still work.",
    },
    credit: {
      radarBy: "Radar by",
      afterRadar: "; at high zoom the radar image is scaled up from its coarsest tiles. Basemap by",
      afterBasemap: ", © OpenMapTiles, data © OpenStreetMap contributors.",
    },
  },
  {
    label: "Radar Langsung",
    lead: "Radar hujan untuk dua jam lalu, bersama lokasi yang anda ikuti. Klik di mana-mana untuk melihat cuaca di tempat itu.",
    backToPlace: (name) => `Ramalan ${name}`,
    center: "Pusatkan Peta",
    banner: {
      title: "2 Jam Lepas",
      locations: "Lokasi",
    },
    reading: {
      title: "Membaca Peta",
      description: "Maksud warna, pil dan kawalan pada radar.",
      rainTerm: "Warna Radar",
      rain: "Warna menunjukkan kederasan hujan: biru pucat ialah hujan renyai, dan warna yang lebih pekat serta hangat ialah hujan lebih lebat. Salji dilukis dengan warnanya sendiri.",
      timelineTerm: "Garis Masa",
      timeline:
        "Main bergerak melalui dua jam lalu, bermula yang terlama. Seret peluncur untuk berhenti pada satu detik; kapsyen memberitahu berapa lama sebelum bingkai terkini.",
      homeTerm: "Rumah",
      home: "Lokasi rumah anda, bertanda rumah. Halakan penuding untuk cuacanya; klik untuk zum masuk dan kekalkan tetingkap timbul.",
      savedTerm: "Lokasi Tersimpan",
      saved:
        "Lokasi lain yang anda ikuti, bertanda pin. Halakan penuding pada satu untuk cuaca sekarang dan pautan ke ramalannya; klik untuk zum masuk dan kekalkan tetingkap timbul.",
      centerTerm: "Butang Pusat",
      center:
        "Di bawah butang zum: mengembalikan peta kepada lokasi anda, atau tempat yang anda buka daripadanya, dan menutup tetingkap timbul.",
      clickTerm: "Tempat Lain",
      click:
        "Klik mana-mana tempat untuk melihat cuaca di situ: suhu, rasa suhu, angin dan kemungkinan hujan.",
      areaTerm: "Zum ke Satu Tempat",
      area: "Dari dekat, pin sesuatu tempat digantikan dengan cincin putus-putus kira-kira 6 km di sekelilingnya. Ia panduan kawasan sekitar, bukan sempadan bandar.",
      zoomTerm: "Zum Dekat",
      zoom: "Radar kelihatan berpetak dari dekat kerana dibesarkan daripada data yang lebih kasar. Ia menunjukkan di mana hujan, bukan jalan yang tepat.",
    },
    popup: {
      loading: "Memuatkan cuaca…",
      failed: "Tidak dapat memuatkan cuaca di sini. Cuba lagi sebentar nanti.",
      feels: (condition, temperature) => `${condition} · terasa ${temperature}`,
      windRain: (speed, percent) => `Angin ${speed} · Hujan ${percent}%`,
      openForecast: "Buka Ramalan →",
    },
    region:
      "Peta cuaca. Lokasi tersimpan ialah pautan; klik di mana-mana lagi untuk melihat cuaca di tempat itu.",
    mapFailed:
      "Peta tidak dapat dimuatkan. Ini biasanya bermakna WebGL dimatikan pada pelayar anda, atau pembekal peta tidak dapat dicapai. Lokasi anda masih boleh diakses daripada papan pemuka.",
    radar: {
      pause: "Jeda Animasi Radar",
      play: "Mainkan Animasi Radar",
      time: "Masa Radar",
      latestFrame: "Bingkai terkini",
      minutesBefore: (minutes) => `${minutes} minit sebelum bingkai terkini`,
      caption: (frame) => `Radar · ${frame}`,
      latest: "(terkini)",
      earlier: (minutes) => `(${minutes} min lebih awal)`,
      opacity: "Kelegapan Radar",
      percent: (value) => `${value} peratus`,
      opacityCaption: (value) => `Kelegapan Radar · ${value}%`,
      unavailable:
        "Radar hujan tidak tersedia buat masa ini. Peta dan lokasi anda masih berfungsi.",
    },
    credit: {
      radarBy: "Radar oleh",
      afterRadar:
        "; pada zum tinggi, imej radar dibesarkan daripada jubin paling kasarnya. Peta asas oleh",
      afterBasemap: ", © OpenMapTiles, data © penyumbang OpenStreetMap.",
    },
  },
);
