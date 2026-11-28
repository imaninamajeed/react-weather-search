/**
 * A place at this latitude gets the sky its longitude asks for: /place/7.77,N shows palette N, by
 * overriding the current hour's condition (the fixture's sun rises at 06:56 and sets at 18:58).
 * Used by e2e/sky.spec.ts to check every sky, and handy for looking at them by hand.
 */
export const SKY_LATITUDE = 7.77;
export const SKY_SCENES = [
  { palette: "clear-day", weather_code: 0, is_day: 1, cloud_cover: 5, time: "12:00" },
  { palette: "golden", weather_code: 1, is_day: 1, cloud_cover: 30, time: "18:30" },
  { palette: "clear-night", weather_code: 0, is_day: 0, cloud_cover: 5, time: "22:00" },
  { palette: "overcast-day", weather_code: 3, is_day: 1, cloud_cover: 100, time: "12:00" },
  { palette: "overcast-night", weather_code: 3, is_day: 0, cloud_cover: 100, time: "22:00" },
  { palette: "rain-day", weather_code: 63, is_day: 1, cloud_cover: 90, time: "12:00" },
  { palette: "rain-night", weather_code: 63, is_day: 0, cloud_cover: 90, time: "22:00" },
  { palette: "storm", weather_code: 95, is_day: 1, cloud_cover: 100, time: "15:00" },
  { palette: "snow", weather_code: 73, is_day: 1, cloud_cover: 100, time: "12:00" },
  { palette: "fog", weather_code: 45, is_day: 1, cloud_cover: 100, time: "09:00" },
];
