/**
 * The logic of the PWA pack that the kits, the client store and the service worker share. No DOM.
 */

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

function hex(name: string, value: string): string {
  if (!HEX.test(value)) throw new Error(`${name}: "${value}" is not a hex colour such as #1d2021`);
  return value;
}

function text(name: string, value: string | undefined): string {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${name}: a text is required`);
  return value;
}

// The manifest.

export const DISPLAYS = ["standalone", "minimal-ui", "fullscreen", "browser"] as const;

export interface ManifestIcon {
  readonly src: string;
  /** For example "512x512", or "any" for an SVG. */
  readonly sizes: string;
  readonly type?: string;
  readonly purpose?: "any" | "maskable";
}

export interface ManifestInput {
  readonly name: string;
  /** The name under the icon. Defaults to the name. */
  readonly shortName?: string;
  /** The address the app opens at. Defaults to "/". */
  readonly start?: string;
  /** The addresses that belong to the app. Defaults to "/". */
  readonly scope?: string;
  readonly display?: (typeof DISPLAYS)[number];
  readonly description?: string;
  readonly icons: readonly ManifestIcon[];
  /** The colour of the title bar: the canvas colour of the project's default palette. */
  readonly themeColor: string;
  /** The colour of the splash screen: the canvas colour of the project's default palette. */
  readonly backgroundColor: string;
}

export interface WebAppManifest {
  readonly name: string;
  readonly short_name: string;
  readonly start_url: string;
  readonly scope: string;
  readonly display: (typeof DISPLAYS)[number];
  readonly description?: string;
  readonly icons: readonly ManifestIcon[];
  readonly theme_color: string;
  readonly background_color: string;
}

/** The web app manifest of an app. Throws on a missing or wrong value. */
export function buildManifest(input: ManifestInput): WebAppManifest {
  const display = input.display ?? "standalone";
  if (!DISPLAYS.includes(display))
    throw new Error(`display: "${display}" is not one of ${DISPLAYS.join(", ")}`);
  if (!Array.isArray(input.icons) || input.icons.length === 0)
    throw new Error("icons: give at least one icon");
  for (const icon of input.icons) {
    text("icons.src", icon.src);
    text("icons.sizes", icon.sizes);
  }
  return {
    name: text("name", input.name),
    short_name: input.shortName === undefined ? input.name : text("shortName", input.shortName),
    start_url: input.start ?? "/",
    scope: input.scope ?? "/",
    display,
    ...(input.description ? { description: input.description } : {}),
    icons: input.icons,
    theme_color: hex("themeColor", input.themeColor),
    background_color: hex("backgroundColor", input.backgroundColor),
  };
}

// The app icon.

export interface AppIconInput {
  /** The body of a 16 × 16 glyph, as in @tailor/core/glyphs.gen or an icon set. */
  readonly glyph: string;
  /** The plate: the canvas colour of the project's default palette. */
  readonly canvas: string;
  /** The glyph: the accent colour of the project's default palette. */
  readonly accent: string;
  /** A full-bleed plate with the glyph inside the safe zone, for `purpose: "maskable"`. */
  readonly maskable?: boolean;
}

const ICON = 512;

/**
 * A standalone SVG app icon. It holds literal colours, because a file outside the page has no tokens.
 * The plain icon is a rounded plate; the maskable one fills the square and keeps the glyph in the
 * centre 40 % radius that every mask shape leaves visible.
 */
export function appIcon({ glyph, canvas, accent, maskable = false }: AppIconInput): string {
  text("glyph", glyph);
  const plate = maskable
    ? `<rect width="${ICON}" height="${ICON}" fill="${hex("canvas", canvas)}"/>`
    : `<rect width="${ICON}" height="${ICON}" rx="${ICON * 0.22}" fill="${hex("canvas", canvas)}"/>`;
  const size = ICON * (maskable ? 0.5 : 0.625);
  const offset = (ICON - size) / 2;
  const colour = hex("accent", accent);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ICON} ${ICON}">${plate}<g transform="translate(${offset} ${offset}) scale(${size / 16})" fill="${colour}" color="${colour}">${glyph}</g></svg>`;
}

// Install.

/** The browser families that install from their own menu, with steps that the UI shows. */
export type InstallSteps = "ios" | "mac" | "firefox-android";

export interface InstallEnvironment {
  /** The window knows the `beforeinstallprompt` event (Chromium). */
  readonly promptEvent: boolean;
  /** `navigator.standalone` exists (Safari and the other browsers on iOS and iPadOS). */
  readonly iosStandalone: boolean;
  /** `window.safari` exists (Safari on macOS). */
  readonly safariObject: boolean;
  readonly userAgent: string;
}

/**
 * The manual install steps for this browser, or null when it has an install prompt or no way to install.
 * Feature checks first; the user agent only for Firefox on Android, which has no feature to check.
 */
export function installSteps(env: InstallEnvironment): InstallSteps | null {
  if (env.promptEvent) return null;
  if (env.iosStandalone) return "ios";
  if (env.safariObject) return "mac";
  if (/Android/.test(env.userAgent) && /Firefox\//.test(env.userAgent)) return "firefox-android";
  return null;
}

/** A service worker registers on https: and on the local machine only. */
export const isSecureHost = (protocol: string, hostname: string): boolean =>
  protocol === "https:" || ["localhost", "127.0.0.1", "[::1]"].includes(hostname);

export const UPDATE_INTERVAL = 3_600_000;

/** At most one update check per hour when the page comes back. */
export const shouldCheckForUpdate = (last: number, now: number): boolean => now - last >= UPDATE_INTERVAL;

// The client state.

export interface PwaState {
  /** The browser offers its install prompt (Chromium). */
  readonly installable: boolean;
  /** The app runs as an installed app. */
  readonly installed: boolean;
  /** A new version waits; applyUpdate() starts it. */
  readonly updateReady: boolean;
  readonly offline: boolean;
  /** The browser supports service workers on this page. */
  readonly supported: boolean;
  /** The manual install steps, when the browser has no install prompt. */
  readonly steps: InstallSteps | null;
}

export const INITIAL_STATE: PwaState = {
  installable: false,
  installed: false,
  updateReady: false,
  offline: false,
  supported: false,
  steps: null,
};

/** The "Install app" item shows when the app is not installed and the browser can install it. */
export const canInstall = (state: PwaState): boolean =>
  !state.installed && (state.installable || state.steps !== null);

/** The state after a change; the same object when nothing changed, as useSyncExternalStore needs. */
export function nextState(state: PwaState, change: Partial<PwaState>): PwaState {
  const keys = Object.keys(change) as (keyof PwaState)[];
  return keys.some((key) => change[key] !== state[key]) ? { ...state, ...change } : state;
}

// The service worker's routing.

export interface WorkerConfig {
  /** Names the cache. A new version replaces the cache of the old one. */
  readonly version: string;
  /** The app's own files, kept at install. The first one is the app page for `spa`. */
  readonly shell: readonly string[];
  /** The page shown for a navigation with no network and no cached page. */
  readonly offline?: string;
  /** A single-page app: any address falls back to the cached `shell[0]`. */
  readonly spa?: boolean;
  /** Path prefixes of further static files, for example "/assets/". */
  readonly static?: readonly string[];
  /** Milliseconds a navigation waits for the network before it uses the cache. Default 4000. */
  readonly timeout?: number;
}

export interface WorkerSettings {
  readonly version: string;
  readonly shell: readonly string[];
  readonly offline: string | null;
  readonly spa: boolean;
  readonly static: readonly string[];
  readonly timeout: number;
}

/** Checks the config that the app's worker file passes. Throws on a wrong value. */
export function workerSettings(config: WorkerConfig): WorkerSettings {
  text("version", config.version);
  if (!Array.isArray(config.shell) || config.shell.length === 0)
    throw new Error("shell: give at least the app page");
  for (const file of config.shell) text("shell", file);
  const timeout = config.timeout ?? 4000;
  if (!Number.isFinite(timeout) || timeout <= 0) throw new Error("timeout: a number of milliseconds above 0");
  return {
    version: config.version,
    shell: config.shell,
    offline: config.offline === undefined ? null : text("offline", config.offline),
    spa: config.spa === true,
    static: config.static ?? [],
    timeout,
  };
}

export const CACHE_PREFIX = "tailor-";
export const cacheName = (version: string): string => `${CACHE_PREFIX}${version}`;

/** The caches of other versions, to delete when a version activates. Caches of other code stay. */
export const oldCaches = (names: readonly string[], version: string): string[] =>
  names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== cacheName(version));

/** The files to keep at install, each once. */
export const precacheList = (settings: WorkerSettings): string[] => [
  ...new Set([...settings.shell, ...(settings.offline ? [settings.offline] : [])]),
];

export type Strategy = "network-first" | "stale-while-revalidate" | "none";

export interface RequestFacts {
  readonly method: string;
  readonly url: string;
  readonly mode: string;
  readonly destination: string;
}

const STATIC_DESTINATIONS = ["style", "script", "font", "image"];

/**
 * How the worker answers a request. Only GET requests to the worker's own origin: navigations go to the
 * network first, static files are served from the cache and refreshed; the rest (API calls) is left alone.
 */
export function strategyFor(request: RequestFacts, origin: string, settings: WorkerSettings): Strategy {
  if (request.method !== "GET") return "none";
  const url = new URL(request.url);
  if (url.origin !== origin) return "none";
  if (request.mode === "navigate") return "network-first";
  if (STATIC_DESTINATIONS.includes(request.destination)) return "stale-while-revalidate";
  if (settings.static.some((prefix) => url.pathname.startsWith(prefix))) return "stale-while-revalidate";
  return "none";
}

/** Only a plain answer of the app itself is kept: never an error, a redirect or another origin's answer. */
export const isCacheable = (response: { ok: boolean; type: string; redirected: boolean }): boolean =>
  response.ok && response.type === "basic" && !response.redirected;

/** What a navigation with no network falls back to, in order. */
export function navigationFallbacks(url: string, settings: WorkerSettings): string[] {
  const first = settings.shell[0];
  return [
    ...new Set([
      url,
      ...(settings.spa && first ? [first] : []),
      ...(settings.offline ? [settings.offline] : []),
    ]),
  ];
}
