// @vitest-environment jsdom
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Place } from "@/lib/places";
import { SearchCommand } from "./search-command";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const theme = vi.hoisted(() => ({ resolved: "light", setTheme: vi.fn() }));
vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: theme.resolved, setTheme: theme.setTheme }),
}));

const place = (id: number, name: string): Place => ({
  key: `${id}-${name.toLowerCase()}`,
  name,
  country: "Japan",
  region: "Kanto",
  latitude: 35,
  longitude: 139,
});

/** A fetch response the test resolves by hand, to control response order. */
function deferred() {
  let resolve!: (places: Place[]) => void;
  const promise = new Promise<Response>((res) => {
    resolve = (places) => res(Response.json({ places }));
  });
  return { promise, resolve };
}

beforeAll(() => {
  // cmdk and Radix expect these browser APIs, which jsdom lacks.
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.scrollIntoView = () => {};
});

beforeEach(() => {
  window.localStorage.clear();
  push.mockReset();
  theme.setTheme.mockReset();
  theme.resolved = "light";
});

afterEach(() => vi.unstubAllGlobals());

async function openDialog() {
  const user = userEvent.setup();
  render(<SearchCommand />);
  await user.click(screen.getByRole("button", { name: "Search Places" }));
  return { user, input: await screen.findByPlaceholderText("Search a city…") };
}

describe("SearchCommand", () => {
  it("opens with the / shortcut, but not while typing in another field", async () => {
    const user = userEvent.setup();
    render(
      <>
        <input aria-label="other" />
        <SearchCommand />
      </>,
    );
    await user.click(screen.getByLabelText("other"));
    await user.keyboard("/");
    expect(screen.queryByPlaceholderText("Search a city…")).not.toBeInTheDocument();

    await user.click(document.body);
    await user.keyboard("/");
    expect(await screen.findByPlaceholderText("Search a city…")).toBeInTheDocument();
  });

  it("flips the theme with D, but not while typing or with a modifier", async () => {
    const user = userEvent.setup();
    render(
      <>
        <input aria-label="other" />
        <SearchCommand />
      </>,
    );
    await user.click(screen.getByLabelText("other"));
    await user.keyboard("d");
    expect(theme.setTheme).not.toHaveBeenCalled();

    await user.click(document.body);
    await user.keyboard("{Control>}d{/Control}");
    expect(theme.setTheme).not.toHaveBeenCalled();

    await user.keyboard("d");
    expect(theme.setTheme).toHaveBeenCalledExactlyOnceWith("dark");
  });

  it("flips from dark back to light", async () => {
    theme.resolved = "dark";
    const user = userEvent.setup();
    render(<SearchCommand />);
    await user.keyboard("D");
    expect(theme.setTheme).toHaveBeenCalledExactlyOnceWith("light");
  });

  it("offers the theme command in the palette, with its D hint, and closes after using it", async () => {
    const { user } = await openDialog();
    const item = screen.getByRole("option", { name: /Switch to Dark Theme/ });
    expect(item).toHaveTextContent("D");

    await user.click(item);
    expect(theme.setTheme).toHaveBeenCalledExactlyOnceWith("dark");
    expect(screen.queryByPlaceholderText("Search a city…")).not.toBeInTheDocument();
  });

  it("finds the theme command by typing, and hides it for a plain place search", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ places: [] })));
    const { user, input } = await openDialog();

    await user.type(input, "dark");
    expect(await screen.findByRole("option", { name: /Switch to Dark Theme/ })).toBeVisible();

    await user.clear(input);
    await user.type(input, "tokyo");
    await waitFor(() =>
      expect(
        screen.queryByRole("option", { name: /Switch to Dark Theme/ }),
      ).not.toBeInTheDocument(),
    );
  });

  it("debounces typing into a single request and navigates on select", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ places: [place(1, "Tokyo")] }));
    vi.stubGlobal("fetch", fetchMock);
    const { user, input } = await openDialog();

    await user.type(input, "tokyo");
    const option = await screen.findByRole("option", { name: /Tokyo/ });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/places/search?q=tokyo");

    await user.click(option);
    expect(push).toHaveBeenCalledWith("/place/1-tokyo");
    expect(JSON.parse(window.localStorage.getItem("isobar:recent-searches")!)).toHaveLength(1);
  });

  it("never lets a slower, older response overwrite a newer one", async () => {
    const slow = deferred();
    const fast = deferred();
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => slow.promise)
      .mockImplementationOnce(() => fast.promise);
    vi.stubGlobal("fetch", fetchMock);
    const { user, input } = await openDialog();

    await user.type(input, "to");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    await user.type(input, "kyo");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    await act(async () => fast.resolve([place(2, "Tokyo")]));
    expect(await screen.findByRole("option", { name: /Tokyo/ })).toBeInTheDocument();

    await act(async () => slow.resolve([place(3, "Toronto")]));
    expect(screen.queryByRole("option", { name: /Toronto/ })).not.toBeInTheDocument();
  });

  it("explains failures instead of failing silently", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 502 })));
    const { user, input } = await openDialog();
    await user.type(input, "tokyo");
    expect(await screen.findByText(/Search is unavailable right now/)).toBeInTheDocument();
  });

  it("says when nothing matches", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ places: [] })));
    const { user, input } = await openDialog();
    await user.type(input, "zzzz");
    expect(await screen.findByText("No places match “zzzz”.")).toBeInTheDocument();
  });

  it("does not search for a single character", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { user, input } = await openDialog();
    await user.type(input, "t");
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
