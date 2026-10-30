import { defineMessages } from "../define";

/** The welcome page at `/`. */
export const welcome = defineMessages(
  {
    welcomeTo: "Welcome to ",
    taglineStart: "Forecasts, alerts, and",
    taglineEnd: "how far to trust them.",
    body: "Weather for the locations you follow. There's no account: your locations stay on this device.",
    findYourCity: "Find Your City",
    openDashboard: "Open the Dashboard",
    features: "Features",
    feature: {
      alerts: { label: "Alerts", text: "Official warnings and ours" },
      confidence: { label: "Confidence", text: "Do the models agree?" },
      climate: { label: "Climate", text: "Is this week unusual?" },
      radar: { label: "Radar", text: "Rain, last two hours" },
    },
    preview: {
      label:
        "Example cards from Isobar: three weather models that agree for three days and then drift apart, so confidence falls from high to low; a heavy rain advisory until 10 PM; and 26 °C with heavy rain now in Subang Jaya.",
      confidence: "Forecast Confidence",
      high: "High",
      low: "Low",
      advisory: "Heavy Rain Advisory",
      until: "· Until 10 PM",
      example: "Example · Subang Jaya · 15:30",
      summary: "Heavy rain now, easing around 10 PM.",
    },
  },
  {
    welcomeTo: "Selamat datang ke ",
    taglineStart: "Ramalan, makluman, dan",
    taglineEnd: "setakat mana untuk mempercayainya.",
    body: "Cuaca untuk lokasi yang anda ikuti. Tiada akaun: lokasi anda kekal pada peranti ini.",
    findYourCity: "Cari Bandar Anda",
    openDashboard: "Buka Papan Pemuka",
    features: "Ciri-ciri",
    feature: {
      alerts: { label: "Makluman", text: "Amaran rasmi dan milik kami" },
      confidence: { label: "Keyakinan", text: "Adakah model sependapat?" },
      climate: { label: "Iklim", text: "Adakah minggu ini luar biasa?" },
      radar: { label: "Radar", text: "Hujan, dua jam lalu" },
    },
    preview: {
      label:
        "Contoh kad daripada Isobar: tiga model cuaca yang sependapat selama tiga hari kemudian berbeza, jadi keyakinan jatuh daripada tinggi kepada rendah; nasihat hujan lebat sehingga 10 PTG; dan 26 °C dengan hujan lebat sekarang di Subang Jaya.",
      confidence: "Keyakinan Ramalan",
      high: "Tinggi",
      low: "Rendah",
      advisory: "Nasihat Hujan Lebat",
      until: "· Sehingga 10 PTG",
      example: "Contoh · Subang Jaya · 15:30",
      summary: "Hujan lebat sekarang, reda sekitar 10 PTG.",
    },
  },
);
