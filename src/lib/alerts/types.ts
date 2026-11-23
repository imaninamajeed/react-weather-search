export type AlertSeverity = "advisory" | "warning";

export type HazardKind =
  "thunderstorm" | "rain" | "wind" | "heat" | "frost" | "snow" | "air-quality";

/** A hazard derived from the forecast by our own thresholds (see hazards.ts). Not an official warning. */
export interface ForecastHazard {
  source: "forecast";
  id: string;
  kind: HazardKind;
  severity: AlertSeverity;
  /** "hour": start/end are the first/last affected hour; "day": the first/last affected date. */
  granularity: "hour" | "day";
  start: string;
  end: string;
  /** Peak value in metric units; what it measures depends on `metric`. */
  peak: number;
  metric: "probability" | "rate" | "total" | "gust" | "max-temp" | "min-temp" | "snowfall" | "aqi";
}

/** A warning published by a national weather service. */
export interface OfficialAlert {
  source: "met-malaysia" | "nws";
  id: string;
  severity: AlertSeverity;
  kind: HazardKind | "other";
  title: string;
  /** Issuer's own headline, when it adds something to the title. */
  summary?: string;
  text: string;
  instruction?: string;
  /** Naive local wall-clock times at the place, or null when the issuer gave none. */
  starts: string | null;
  ends: string | null;
  issuer: string;
  url: string;
}

export type WeatherAlert = ForecastHazard | OfficialAlert;

export interface SourceStatus {
  id: "forecast" | "met-malaysia" | "nws";
  label: string;
  /** "unavailable": we asked and the feed didn't answer, so absence of alerts isn't confirmed. */
  status: "ok" | "unavailable";
}

export interface PlaceAlerts {
  alerts: WeatherAlert[];
  sources: SourceStatus[];
}
