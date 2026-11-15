/**
 * The theme switch: skin, palette and mode on <html>, remembered across visits.
 * Framework-free. Both kits use this one implementation.
 */

export type Mode = "dark" | "light";

export interface ThemeConfig {
  /** Prefix of the storage keys, one per project. */
  readonly key: string;
  readonly skins: readonly string[];
  readonly palettes: readonly string[];
  readonly defaults: { readonly skin: string; readonly palette: string; readonly mode: Mode | "auto" };
  /** Folder of the skin and palette stylesheets, with a trailing slash. Leave out when one stylesheet holds them all. */
  readonly base?: string;
  /** Display names per id. */
  readonly labels?: Readonly<Record<string, string>>;
}

export interface ThemeState {
  readonly skin: string;
  readonly palette: string;
  readonly mode: Mode;
}

export interface Theme {
  readonly config: ThemeConfig;
  get(): ThemeState;
  set(change: Partial<ThemeState>): void;
  subscribe(listener: (state: ThemeState) => void): () => void;
  /** The current colour of a token as "rgb(r, g, b)", for code that draws on a canvas. */
  color(token: string): string;
}

export const THEME_EVENT = "t:theme";

const read = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage can be off (private mode): the choice then lasts for this page only.
  }
};

const systemMode = (): Mode =>
  typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";

/** The state for this visit: the address first, then the stored choice, then the defaults. */
export function resolveTheme(config: ThemeConfig, search = ""): ThemeState {
  const params = new URLSearchParams(search);
  const pick = (name: "skin" | "palette", allowed: readonly string[]): string => {
    const candidates = [params.get(name), read(`${config.key}.${name}`), config.defaults[name]];
    return candidates.find((c): c is string => c !== null && allowed.includes(c)) ?? allowed[0] ?? "";
  };
  const modes = [params.get("mode"), read(`${config.key}.mode`), config.defaults.mode];
  const mode = modes.find((m): m is Mode => m === "dark" || m === "light") ?? systemMode();
  return { skin: pick("skin", config.skins), palette: pick("palette", config.palettes), mode };
}

function apply(config: ThemeConfig, state: ThemeState): void {
  const root = document.documentElement;
  root.dataset.skin = state.skin;
  root.dataset.palette = state.palette;
  root.dataset.mode = state.mode;
  if (config.base === undefined) return;
  for (const [id, href] of [
    ["t-skin", `${config.base}skins/${state.skin}.css`],
    ["t-palette", `${config.base}palettes/${state.palette}.css`],
  ] as const) {
    const link = document.getElementById(id);
    if (link instanceof HTMLLinkElement && link.getAttribute("href") !== href) link.href = href;
  }
}

let probe: CanvasRenderingContext2D | null = null;

function toRgb(css: string): string {
  if (!probe) {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    probe = canvas.getContext("2d", { willReadFrequently: true });
  }
  if (!probe) return css;
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = css;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
  return `rgb(${r}, ${g}, ${b})`;
}

export function createTheme(config: ThemeConfig): Theme {
  let state = resolveTheme(config, typeof location === "undefined" ? "" : location.search);
  const listeners = new Set<(state: ThemeState) => void>();
  if (typeof document !== "undefined") apply(config, state);

  return {
    config,
    get: () => state,
    set(change) {
      const next: ThemeState = {
        skin: change.skin && config.skins.includes(change.skin) ? change.skin : state.skin,
        palette: change.palette && config.palettes.includes(change.palette) ? change.palette : state.palette,
        mode: change.mode === "dark" || change.mode === "light" ? change.mode : state.mode,
      };
      if (next.skin === state.skin && next.palette === state.palette && next.mode === state.mode) return;
      state = next;
      write(`${config.key}.skin`, state.skin);
      write(`${config.key}.palette`, state.palette);
      write(`${config.key}.mode`, state.mode);
      apply(config, state);
      for (const listener of listeners) listener(state);
      document.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: state }));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    color(token) {
      const name = token.startsWith("--") ? token : `--t-${token}`;
      const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return toRgb(value || "#000");
    },
  };
}

/**
 * The script that runs in <head> before the first paint, so the page never flashes the wrong theme.
 * It sets the three attributes and, when the styles are separate files, writes their links.
 */
export function prepaintScript(config: ThemeConfig): string {
  const c = JSON.stringify({
    k: config.key,
    s: config.skins,
    p: config.palettes,
    d: config.defaults,
    b: config.base ?? null,
  });
  return (
    `(function(c){var q=new URLSearchParams(location.search),g=function(n){try{return localStorage.getItem(c.k+"."+n)}catch(e){return null}},` +
    `f=function(n,a){var v=[q.get(n),g(n),c.d[n]];for(var i=0;i<v.length;i++)if(v[i]&&a.indexOf(v[i])>-1)return v[i];return a[0]||""},` +
    `s=f("skin",c.s),p=f("palette",c.p),m=f("mode",["dark","light"]);` +
    `if(c.d.mode==="auto"&&[q.get("mode"),g("mode")].every(function(v){return v!=="dark"&&v!=="light"}))m=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";` +
    `var h=document.documentElement;h.dataset.skin=s;h.dataset.palette=p;h.dataset.mode=m;` +
    `if(c.b!==null)document.write('<link id="t-skin" rel="stylesheet" href="'+c.b+"skins/"+s+'.css"><link id="t-palette" rel="stylesheet" href="'+c.b+"palettes/"+p+'.css">')` +
    `})(${c});`
  );
}
