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
      description:
        "The short version: blue is rain, pins are your places. Point at a pin to see its weather.",
      rainTerm: "Blue Is Rain",
      rain: "Paler blue is light rain. Deeper, warmer colours are heavier.",
      homeTerm: "Home Pin",
      home: "Your home place. Click it to zoom in.",
      savedTerm: "Saved Pins",
      saved: "Your other places. Point at one for the weather; click to zoom in. On a phone, tap.",
      areaTerm: "Dashed Circle",
      area: "Zoom in close and a pin becomes a circle about 6 km around. Stay inside it to keep the weather showing.",
      timelineTerm: "Play Button",
      timeline: "Plays the last 2 hours of rain. Drag the slider to stop on one moment.",
      centerTerm: "Center Button",
      center: "Takes you back to your places.",
      clickTerm: "Any Other Spot",
      click: "Click it for the weather there.",
      zoomTerm: "Blocky Radar",
      zoom: "Normal when zoomed in. The radar is less detailed than the map.",
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
      description:
        "Ringkasnya: biru ialah hujan, pin ialah tempat anda. Halakan penuding pada pin untuk melihat cuacanya.",
      rainTerm: "Biru Ialah Hujan",
      rain: "Biru pucat ialah hujan renyai. Warna lebih pekat dan hangat ialah hujan lebih lebat.",
      homeTerm: "Pin Rumah",
      home: "Tempat rumah anda. Klik untuk zum masuk.",
      savedTerm: "Pin Tersimpan",
      saved:
        "Tempat anda yang lain. Halakan penuding untuk cuaca; klik untuk zum masuk. Pada telefon, ketik.",
      areaTerm: "Bulatan Putus-putus",
      area: "Zum dekat dan pin menjadi bulatan kira-kira 6 km di sekelilingnya. Kekal di dalamnya untuk terus melihat cuaca.",
      timelineTerm: "Butang Main",
      timeline: "Memainkan hujan 2 jam lalu. Seret peluncur untuk berhenti pada satu detik.",
      centerTerm: "Butang Pusat",
      center: "Membawa anda kembali kepada tempat anda.",
      clickTerm: "Tempat Lain",
      click: "Klik untuk melihat cuaca di situ.",
      zoomTerm: "Radar Berpetak",
      zoom: "Biasa apabila dizum. Radar kurang terperinci berbanding peta.",
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
