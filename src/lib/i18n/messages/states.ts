import { defineMessages } from "../define";

/** Pages that have nothing to show: errors, not found, offline. */
export const states = defineMessages(
  {
    reference: (digest: string) => `Reference: ${digest}`,
    error: {
      label: "Something Went Wrong",
      title: "The Forecast Didn't Load",
      body: "Our weather provider didn't respond in time. This is usually temporary.",
      backToDashboard: "Back to Dashboard",
    },
    notFound: {
      title: "We Couldn't Find That Location",
      search: "Search for a Location",
      body: "The link may be out of date, or the location may not exist. Search for a city to find it.",
    },
    offline: {
      label: "No Connection",
      title: "You're Offline",
      back: "Back to Your Dashboard",
      body: "This page hasn't been opened on this device yet, so there's nothing saved to show. Locations you've already viewed still work offline, with the forecast from the last time you loaded them.",
    },
    globalError: {
      title: "Something Went Wrong",
      body: "Isobar hit an unexpected error. Trying again usually fixes it.",
    },
    loadingForecast: "Loading Forecast",
  },
  {
    reference: (digest) => `Rujukan: ${digest}`,
    error: {
      label: "Sesuatu Telah Berlaku",
      title: "Ramalan Tidak Dapat Dimuatkan",
      body: "Pembekal cuaca kami tidak membalas dalam masa yang ditetapkan. Ini biasanya sementara sahaja.",
      backToDashboard: "Kembali ke Papan Pemuka",
    },
    notFound: {
      title: "Kami Tidak Menjumpai Lokasi Itu",
      search: "Cari Lokasi",
      body: "Pautan mungkin sudah lapuk, atau lokasi itu tidak wujud. Cari sebuah bandar untuk menemuinya.",
    },
    offline: {
      label: "Tiada Sambungan",
      title: "Anda di Luar Talian",
      back: "Kembali ke Papan Pemuka Anda",
      body: "Halaman ini belum dibuka pada peranti ini, jadi tiada apa yang disimpan untuk dipaparkan. Lokasi yang telah anda lihat masih berfungsi di luar talian, dengan ramalan daripada kali terakhir anda memuatkannya.",
    },
    globalError: {
      title: "Sesuatu Telah Berlaku",
      body: "Isobar menghadapi ralat yang tidak dijangka. Mencuba semula biasanya menyelesaikannya.",
    },
    loadingForecast: "Memuatkan Ramalan",
  },
);
