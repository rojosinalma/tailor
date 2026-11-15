import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { createTheme, resolveTheme, THEME_EVENT, type ThemeConfig, type ThemeState } from "./theme";

// bun test has no DOM: these stubs give the theme the few globals it touches.
const store = new Map<string, string>();
const root = { dataset: {} as Record<string, string> };
const doc = Object.assign(new EventTarget(), { documentElement: root });
let systemLight = false;

const define = (name: string, value: unknown): void => {
  Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
};
define("localStorage", {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => store.set(key, value),
});
define("matchMedia", (query: string) => ({ matches: query.includes("light") && systemLight }));
define("document", doc);

afterAll(() => {
  for (const name of ["localStorage", "matchMedia", "document", "location"])
    Reflect.deleteProperty(globalThis, name);
});

beforeEach(() => {
  store.clear();
  root.dataset = {};
  systemLight = false;
  Reflect.deleteProperty(globalThis, "location");
});

const config: ThemeConfig = {
  key: "demo",
  skins: ["plain", "round"],
  palettes: ["gruvbox", "nord", "dracula"],
  defaults: { skin: "round", palette: "nord", mode: "dark" },
};

describe("resolveTheme", () => {
  test("uses the defaults when nothing else is set", () => {
    expect(resolveTheme(config)).toEqual({ skin: "round", palette: "nord", mode: "dark" });
  });

  test("the stored choice wins over the defaults", () => {
    store.set("demo.skin", "plain");
    store.set("demo.palette", "dracula");
    store.set("demo.mode", "light");
    expect(resolveTheme(config)).toEqual({ skin: "plain", palette: "dracula", mode: "light" });
  });

  test("the address wins over the stored choice", () => {
    store.set("demo.palette", "dracula");
    store.set("demo.mode", "light");
    expect(resolveTheme(config, "?palette=gruvbox&mode=dark&skin=plain")).toEqual({
      skin: "plain",
      palette: "gruvbox",
      mode: "dark",
    });
  });

  test("unknown ids fall back to the next source, then to the first allowed id", () => {
    store.set("demo.palette", "missing");
    expect(resolveTheme(config, "?skin=missing&mode=dim")).toEqual({
      skin: "round",
      palette: "nord",
      mode: "dark",
    });
    const broken: ThemeConfig = { ...config, defaults: { skin: "gone", palette: "gone", mode: "light" } };
    expect(resolveTheme(broken)).toEqual({ skin: "plain", palette: "gruvbox", mode: "light" });
  });

  test("mode auto follows the system setting", () => {
    const auto: ThemeConfig = { ...config, defaults: { ...config.defaults, mode: "auto" } };
    expect(resolveTheme(auto).mode).toBe("dark");
    systemLight = true;
    expect(resolveTheme(auto).mode).toBe("light");
    store.set("demo.mode", "dark");
    expect(resolveTheme(auto).mode).toBe("dark");
  });
});

describe("createTheme", () => {
  test("applies the state to <html> at once", () => {
    const theme = createTheme(config);
    expect(theme.get()).toEqual({ skin: "round", palette: "nord", mode: "dark" });
    expect(root.dataset).toEqual({ skin: "round", palette: "nord", mode: "dark" });
  });

  test("reads the address", () => {
    define("location", { search: "?palette=dracula" });
    expect(createTheme(config).get().palette).toBe("dracula");
  });

  test("set() stores, applies and notifies", () => {
    const theme = createTheme(config);
    const seen: ThemeState[] = [];
    theme.subscribe((state) => seen.push(state));
    theme.set({ palette: "gruvbox", mode: "light" });
    const next: ThemeState = { skin: "round", palette: "gruvbox", mode: "light" };
    expect(theme.get()).toEqual(next);
    expect(seen).toEqual([next]);
    expect<unknown>(root.dataset).toEqual(next);
    expect(store.get("demo.palette")).toBe("gruvbox");
    expect(store.get("demo.mode")).toBe("light");
    expect(createTheme(config).get()).toEqual(next);
  });

  test("set() ignores unknown ids and changes that change nothing", () => {
    const theme = createTheme(config);
    let calls = 0;
    theme.subscribe(() => calls++);
    theme.set({ skin: "missing", palette: "missing" });
    theme.set({ palette: "nord" });
    expect(calls).toBe(0);
    expect(store.size).toBe(0);
    theme.set({ skin: "missing", palette: "dracula" });
    expect(theme.get()).toEqual({ skin: "round", palette: "dracula", mode: "dark" });
  });

  test("unsubscribe stops the notices", () => {
    const theme = createTheme(config);
    let calls = 0;
    const stop = theme.subscribe(() => calls++);
    stop();
    theme.set({ mode: "light" });
    expect(calls).toBe(0);
  });

  test(`set() fires the ${THEME_EVENT} event with the new state`, () => {
    const theme = createTheme(config);
    const details: unknown[] = [];
    const listener = (event: Event): void => {
      if (event instanceof CustomEvent) details.push(event.detail);
    };
    doc.addEventListener(THEME_EVENT, listener);
    theme.set({ mode: "light" });
    theme.set({ mode: "light" });
    doc.removeEventListener(THEME_EVENT, listener);
    expect(details).toEqual([{ skin: "round", palette: "nord", mode: "light" }]);
  });
});
