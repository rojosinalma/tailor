import { describe, expect, test } from "bun:test";
import {
  appIcon,
  buildManifest,
  canInstall,
  INITIAL_STATE,
  installSteps,
  isCacheable,
  isSecureHost,
  navigationFallbacks,
  nextState,
  oldCaches,
  precacheList,
  type RequestFacts,
  shouldCheckForUpdate,
  strategyFor,
  UPDATE_INTERVAL,
  workerSettings,
} from "./logic";

const ICONS = [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }];

describe("buildManifest", () => {
  test("fills the defaults", () => {
    expect(
      buildManifest({ name: "Example", icons: ICONS, themeColor: "#1d2021", backgroundColor: "#1d2021" }),
    ).toEqual({
      name: "Example",
      short_name: "Example",
      start_url: "/",
      scope: "/",
      display: "standalone",
      icons: ICONS,
      theme_color: "#1d2021",
      background_color: "#1d2021",
    });
  });
  test("keeps the given values", () => {
    const manifest = buildManifest({
      name: "Example monitor",
      shortName: "Monitor",
      start: "/app/",
      scope: "/app/",
      display: "minimal-ui",
      description: "Watches web-1 and nas.",
      icons: ICONS,
      themeColor: "#fff",
      backgroundColor: "#000",
    });
    expect(manifest.short_name).toBe("Monitor");
    expect(manifest.start_url).toBe("/app/");
    expect(manifest.display).toBe("minimal-ui");
    expect(manifest.description).toBe("Watches web-1 and nas.");
  });
  test("refuses a missing name, no icons and a colour that is not hex", () => {
    const base = { name: "Example", icons: ICONS, themeColor: "#1d2021", backgroundColor: "#1d2021" };
    expect(() => buildManifest({ ...base, name: " " })).toThrow("name");
    expect(() => buildManifest({ ...base, icons: [] })).toThrow("icons");
    expect(() => buildManifest({ ...base, themeColor: "red" })).toThrow("themeColor");
    expect(() => buildManifest({ ...base, icons: [{ src: "", sizes: "any" }] })).toThrow("icons.src");
  });
});

describe("appIcon", () => {
  const glyph = '<path fill="currentColor" d="M0 0h16v16H0z"/>';
  test("draws a rounded plate with the glyph in the accent colour", () => {
    const svg = appIcon({ glyph, canvas: "#1d2021", accent: "#fabd2f" });
    expect(svg).toStartWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">');
    expect(svg).toContain('rx="112.64" fill="#1d2021"');
    expect(svg).toContain('fill="#fabd2f" color="#fabd2f"');
    expect(svg).toContain("translate(96 96) scale(20)");
    expect(svg).toContain(glyph);
  });
  test("the maskable icon fills the square and keeps the glyph in the safe zone", () => {
    const svg = appIcon({ glyph, canvas: "#1d2021", accent: "#fabd2f", maskable: true });
    expect(svg).not.toContain("rx=");
    expect(svg).toContain("translate(128 128) scale(16)");
  });
  test("refuses a colour that is not hex and an empty glyph", () => {
    expect(() => appIcon({ glyph, canvas: "var(--t-canvas)", accent: "#fabd2f" })).toThrow("canvas");
    expect(() => appIcon({ glyph: "", canvas: "#000", accent: "#fff" })).toThrow("glyph");
  });
});

describe("installSteps", () => {
  const env = { promptEvent: false, iosStandalone: false, safariObject: false, userAgent: "" };
  test("a browser with the install prompt needs no steps", () => {
    expect(installSteps({ ...env, promptEvent: true, userAgent: "Android Firefox/140.0" })).toBeNull();
  });
  test("iOS and iPadOS by navigator.standalone, macOS Safari by window.safari", () => {
    expect(installSteps({ ...env, iosStandalone: true })).toBe("ios");
    expect(installSteps({ ...env, safariObject: true })).toBe("mac");
  });
  test("Firefox on Android by the user agent as the last step", () => {
    const ua = "Mozilla/5.0 (Android 15; Mobile; rv:140.0) Gecko/140.0 Firefox/140.0";
    expect(installSteps({ ...env, userAgent: ua })).toBe("firefox-android");
    expect(
      installSteps({ ...env, userAgent: "Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Firefox/140.0" }),
    ).toBeNull();
  });
});

describe("the client state", () => {
  test("only https and the local machine register a worker", () => {
    expect(isSecureHost("https:", "example.com")).toBe(true);
    expect(isSecureHost("http:", "localhost")).toBe(true);
    expect(isSecureHost("http:", "127.0.0.1")).toBe(true);
    expect(isSecureHost("http:", "example.com")).toBe(false);
  });
  test("an update check at most once an hour", () => {
    expect(shouldCheckForUpdate(0, UPDATE_INTERVAL - 1)).toBe(false);
    expect(shouldCheckForUpdate(0, UPDATE_INTERVAL)).toBe(true);
  });
  test("the install item shows when the browser can install and the app is not installed", () => {
    expect(canInstall(INITIAL_STATE)).toBe(false);
    expect(canInstall({ ...INITIAL_STATE, installable: true })).toBe(true);
    expect(canInstall({ ...INITIAL_STATE, steps: "ios" })).toBe(true);
    expect(canInstall({ ...INITIAL_STATE, installable: true, installed: true })).toBe(false);
  });
  test("a change that changes nothing keeps the same object", () => {
    expect(nextState(INITIAL_STATE, { offline: false })).toBe(INITIAL_STATE);
    const next = nextState(INITIAL_STATE, { offline: true });
    expect(next).not.toBe(INITIAL_STATE);
    expect(next.offline).toBe(true);
  });
});

describe("the worker's routing", () => {
  const settings = workerSettings({
    version: "2026-11-15-1",
    shell: ["/", "/tailor/css/tailor.css"],
    offline: "/offline.html",
    static: ["/assets/"],
  });
  const origin = "https://example.com";
  const request = (facts: Partial<RequestFacts>): RequestFacts => ({
    method: "GET",
    url: `${origin}/`,
    mode: "cors",
    destination: "",
    ...facts,
  });

  test("checks the config and fills the defaults", () => {
    expect(settings.timeout).toBe(4000);
    expect(settings.spa).toBe(false);
    expect(() => workerSettings({ version: "", shell: ["/"] })).toThrow("version");
    expect(() => workerSettings({ version: "1", shell: [] })).toThrow("shell");
    expect(() => workerSettings({ version: "1", shell: ["/"], timeout: 0 })).toThrow("timeout");
  });
  test("navigations go to the network first", () => {
    expect(strategyFor(request({ mode: "navigate", destination: "document" }), origin, settings)).toBe(
      "network-first",
    );
  });
  test("static files are served from the cache and refreshed", () => {
    for (const destination of ["style", "script", "font", "image"])
      expect(strategyFor(request({ destination, url: `${origin}/a` }), origin, settings)).toBe(
        "stale-while-revalidate",
      );
    expect(strategyFor(request({ url: `${origin}/assets/data.json` }), origin, settings)).toBe(
      "stale-while-revalidate",
    );
  });
  test("API calls, other origins and other methods are left alone", () => {
    expect(strategyFor(request({ url: `${origin}/api/hosts` }), origin, settings)).toBe("none");
    expect(
      strategyFor(request({ url: "https://cdn.example.net/a.css", destination: "style" }), origin, settings),
    ).toBe("none");
    expect(strategyFor(request({ method: "POST", mode: "navigate" }), origin, settings)).toBe("none");
  });
  test("only a plain answer of the app is kept", () => {
    expect(isCacheable({ ok: true, type: "basic", redirected: false })).toBe(true);
    expect(isCacheable({ ok: true, type: "basic", redirected: true })).toBe(false);
    expect(isCacheable({ ok: false, type: "basic", redirected: false })).toBe(false);
    expect(isCacheable({ ok: false, type: "opaqueredirect", redirected: false })).toBe(false);
    expect(isCacheable({ ok: true, type: "cors", redirected: false })).toBe(false);
  });
  test("a navigation falls back to its page, the app page for a single-page app, then the offline page", () => {
    expect(navigationFallbacks(`${origin}/hosts`, settings)).toEqual([`${origin}/hosts`, "/offline.html"]);
    expect(navigationFallbacks(`${origin}/hosts`, { ...settings, spa: true })).toEqual([
      `${origin}/hosts`,
      "/",
      "/offline.html",
    ]);
  });
  test("keeps each file once and deletes only the old caches of tailor", () => {
    expect(precacheList({ ...settings, offline: "/" })).toEqual(["/", "/tailor/css/tailor.css"]);
    expect(oldCaches(["tailor-2026-11-01-1", "tailor-2026-11-15-1", "app-images"], "2026-11-15-1")).toEqual([
      "tailor-2026-11-01-1",
    ]);
  });
});
