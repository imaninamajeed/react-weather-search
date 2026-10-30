import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Isobar: weather, alerts and forecast confidence",
    short_name: "Isobar",
    description:
      "Forecasts, severe-weather alerts, forecast confidence, climate history and live radar for the locations you follow.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    categories: ["weather"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Dashboard",
        short_name: "Dashboard",
        url: "/dashboard",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Radar Map",
        short_name: "Map",
        url: "/map",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
    screenshots: [
      {
        src: "/screenshots/dashboard-narrow.jpg",
        sizes: "390x844",
        type: "image/jpeg",
        form_factor: "narrow",
        label: "Dashboard with alerts and saved locations",
      },
      {
        src: "/screenshots/dashboard-wide.jpg",
        sizes: "1280x720",
        type: "image/jpeg",
        form_factor: "wide",
        label: "Dashboard on a wide screen",
      },
    ],
  };
}
