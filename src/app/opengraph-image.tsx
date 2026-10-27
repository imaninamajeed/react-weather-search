import { ImageResponse } from "next/og";

export const alt = "Isobar: weather, alerts and forecast confidence";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Brand colours from the original marble logo: turquoise into magenta.
export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        padding: 72,
        color: "white",
        background: "linear-gradient(135deg, #0b8f88 0%, #1b2a4a 55%, #d4147e 100%)",
      }}
    >
      <div style={{ fontSize: 132, fontWeight: 700, letterSpacing: -4 }}>Isobar</div>
      <div style={{ fontSize: 42, marginTop: 12, opacity: 0.92 }}>
        Forecasts, alerts and how far to trust them.
      </div>
      <div style={{ fontSize: 28, marginTop: 28, opacity: 0.75 }}>
        Forecast confidence · Climate history · Live radar
      </div>
    </div>,
    size,
  );
}
