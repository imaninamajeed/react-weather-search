export interface AqiCategory {
  label: string;
  /** Short advice shown under the number. */
  advice: string;
  /** 0 = good … 5 = hazardous; drives colour. */
  level: 0 | 1 | 2 | 3 | 4 | 5;
}

/** US EPA AQI breakpoints. */
export function aqiCategory(aqi: number): AqiCategory {
  if (aqi <= 50) return { label: "Good", advice: "Air quality is satisfactory.", level: 0 };
  if (aqi <= 100) {
    return {
      label: "Moderate",
      advice: "Unusually sensitive people should ease off outdoors.",
      level: 1,
    };
  }
  if (aqi <= 150) {
    return {
      label: "Unhealthy for sensitive groups",
      advice: "Sensitive groups should limit time outdoors.",
      level: 2,
    };
  }
  if (aqi <= 200)
    return {
      label: "Unhealthy",
      advice: "Everyone should reduce prolonged exertion outdoors.",
      level: 3,
    };
  if (aqi <= 300) return { label: "Very unhealthy", advice: "Avoid outdoor exertion.", level: 4 };
  return { label: "Hazardous", advice: "Stay indoors with clean air if possible.", level: 5 };
}
