// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DocumentLanguage, announceLocale, useMessages } from "./client";

function Label() {
  return <p>{useMessages().nav.dashboard}</p>;
}

const setCookie = (value: string) => {
  document.cookie = `lang=${value}; path=/`;
};

afterEach(() => {
  document.cookie = "lang=; path=/; max-age=0";
  document.documentElement.lang = "";
});

describe("language in the browser", () => {
  it("is English with no cookie", () => {
    render(<Label />);
    expect(screen.getByText("Dashboard")).toBeTruthy();
  });

  it("follows the cookie, and changes when the language is announced", () => {
    render(<Label />);
    expect(screen.getByText("Dashboard")).toBeTruthy();
    act(() => {
      setCookie("ms");
      announceLocale();
    });
    expect(screen.getByText("Papan Pemuka")).toBeTruthy();
  });

  it("ignores a cookie it does not recognise", () => {
    setCookie("xx");
    render(<Label />);
    expect(screen.getByText("Dashboard")).toBeTruthy();
  });

  it("sets the document language", () => {
    setCookie("ms");
    render(<DocumentLanguage />);
    expect(document.documentElement.lang).toBe("ms-MY");
  });
});
