import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { fetchJson, openMeteoUrl, UpstreamError } from "./client";

const schema = z.object({ ok: z.boolean() });
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("fetchJson", () => {
  it("returns validated data", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ ok: true })));
    await expect(fetchJson("https://x.test", schema, { source: "t" })).resolves.toEqual({
      ok: true,
    });
  });

  it("retries once on a 5xx and then succeeds", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json({ reason: "boom" }, 503))
      .mockResolvedValueOnce(json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchJson("https://x.test", schema, { source: "t" })).resolves.toEqual({
      ok: true,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("gives up after the retry budget and reports the last status", async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(json({}, 502)));
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchJson("https://x.test", schema, { source: "t" })).rejects.toMatchObject({
      name: "UpstreamError",
      status: 502,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry client errors and surfaces the upstream reason", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(json({ error: true, reason: "Location ID not found." }, 400));
    vi.stubGlobal("fetch", fetchMock);
    const error = await fetchJson("https://x.test", schema, { source: "t" }).catch(
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(UpstreamError);
    expect((error as UpstreamError).status).toBe(400);
    expect((error as UpstreamError).message).toContain("Location ID not found.");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries network failures", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce(json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchJson("https://x.test", schema, { source: "t" })).resolves.toEqual({
      ok: true,
    });
  });

  it("reports timeouts distinctly", async () => {
    const timeout = Object.assign(new Error("timed out"), { name: "TimeoutError" });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(timeout));
    await expect(
      fetchJson("https://x.test", schema, { source: "t", retries: 0, timeoutMs: 50 }),
    ).rejects.toThrow("timed out after 50ms");
  });

  it("rejects responses that don't match the schema", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ ok: "yes" })));
    await expect(fetchJson("https://x.test", schema, { source: "t" })).rejects.toThrow(
      "unexpected shape",
    );
  });

  it("rejects non-JSON bodies", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>", { status: 200 })));
    await expect(fetchJson("https://x.test", schema, { source: "t" })).rejects.toThrow(
      "invalid JSON",
    );
  });
});

describe("openMeteoUrl", () => {
  it("uses the free hosts by default and skips undefined params", () => {
    const url = openMeteoUrl("forecast", "/v1/forecast", { latitude: 3.04, longitude: undefined });
    expect(url.toString()).toBe("https://api.open-meteo.com/v1/forecast?latitude=3.04");
  });

  it("switches to the customer hosts when an API key is set", () => {
    vi.stubEnv("OPEN_METEO_API_KEY", "secret");
    const url = openMeteoUrl("archive", "/v1/archive", { latitude: 1 });
    expect(url.host).toBe("customer-archive-api.open-meteo.com");
    expect(url.searchParams.get("apikey")).toBe("secret");
  });
});
