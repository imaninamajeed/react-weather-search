import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { WeatherIconName } from "@/lib/weather/codes";
import { SkyChip } from "./sky-chip";
import { SkyScene } from "./sky-scene";
import { WeatherIcon } from "./weather-icon";
import { SKY_PALETTES, skyPreset } from "@/lib/weather/sky";

const NAMES: WeatherIconName[] = [
  "clear-day",
  "clear-night",
  "partly-cloudy-day",
  "partly-cloudy-night",
  "cloudy",
  "fog",
  "drizzle",
  "rain",
  "freezing-rain",
  "snow",
  "thunderstorm",
  "hail",
];

describe("WeatherIcon", () => {
  it.each(NAMES)("draws %s as one decorative svg in token colours", (name) => {
    const html = renderToStaticMarkup(<WeatherIcon name={name} />);
    expect(html.match(/<svg/g)).toHaveLength(1);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain(`data-weather-icon="${name}"`);
    // Every fill and stroke comes from a token, so the set follows the theme.
    expect(html).not.toMatch(/(fill|stroke)="#/);
    expect(html).toMatch(/var\(--icon-/);
  });

  it("only moves when asked to, and only with motion allowed", () => {
    expect(renderToStaticMarkup(<WeatherIcon name="rain" />)).not.toContain("animate-");
    const animated = renderToStaticMarkup(<WeatherIcon name="rain" animated />);
    expect(animated).toContain("motion-safe:animate-");
    expect(animated).not.toMatch(/(?<!motion-safe:)\banimate-\[/);
  });
});

describe("SkyScene", () => {
  it.each(SKY_PALETTES)("paints %s as hidden, inert decoration", (palette) => {
    const html = renderToStaticMarkup(<SkyScene scene={skyPreset(palette)} />);
    expect(html).toMatch(/^<div aria-hidden="true" data-sky-art=""/);
    expect(html).toContain("pointer-events-none");
    expect(html).not.toMatch(/(?<!motion-safe:)\banimate-\[/);
  });

  it("draws the same stars on every render, so hydration agrees", () => {
    const scene = skyPreset("clear-night");
    expect(renderToStaticMarkup(<SkyScene scene={scene} />)).toBe(
      renderToStaticMarkup(<SkyScene scene={scene} />),
    );
  });
});

describe("SkyChip", () => {
  it("carries the palette so the icon inside reads the sky's colours", () => {
    const html = renderToStaticMarkup(<SkyChip scene={skyPreset("storm")} icon="thunderstorm" />);
    expect(html).toContain('data-sky="storm"');
    expect(html).toContain('aria-hidden="true"');
  });
});
