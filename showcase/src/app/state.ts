/** The view of the site that a link carries: kit and size in the address and in storage; the theme mirrored into the address. */
import { THEME_EVENT, type ThemeState } from "@tailor/core/theme";
import { useTheme } from "@tailor/react/core/theme-pickers/theme-pickers";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";
import { THEME } from "./data";

export const KITS = ["react", "html"] as const;
export type Kit = (typeof KITS)[number];

export const SIZES = ["fit", "phone", "tablet", "tablet-landscape", "desktop"] as const;
export type Size = (typeof SIZES)[number];

/** The device sizes of the Size control, in CSS pixels. */
export const DEVICES: Readonly<Record<Exclude<Size, "fit">, { width: number; height: number }>> = {
  phone: { width: 390, height: 844 },
  tablet: { width: 820, height: 1180 },
  "tablet-landscape": { width: 1180, height: 820 },
  desktop: { width: 1440, height: 900 },
};

export interface SiteSearch {
  kit?: Kit;
  size?: Size;
  skin?: string;
  palette?: string;
  mode?: ThemeState["mode"];
}

const pick = <T extends string>(allowed: readonly T[], value: unknown): T | undefined =>
  allowed.find((a) => a === value);

/** The search parameters of every address, checked: anything else is dropped. */
export function validateSearch(raw: Record<string, unknown>): SiteSearch {
  return {
    kit: pick(KITS, raw.kit),
    size: pick(SIZES, raw.size),
    skin: pick(THEME.skins, raw.skin),
    palette: pick(THEME.palettes, raw.palette),
    mode: pick(["dark", "light"] as const, raw.mode),
  };
}

const STORE = "tailor-showcase";

function read<T extends string>(name: string, allowed: readonly T[]): T | undefined {
  try {
    return pick(allowed, localStorage.getItem(`${STORE}.${name}`));
  } catch {
    return undefined;
  }
}

function write(name: string, value: string): void {
  try {
    localStorage.setItem(`${STORE}.${name}`, value);
  } catch {
    // Storage can be off: the choice then lasts for this page only.
  }
}

/**
 * Before the theme is created: a skin, palette or mode in the address becomes the stored choice, so the
 * address wins on load. The theme reads the real query string only, and this site keeps its own in the hash.
 */
export function adoptAddressTheme(): void {
  const query = location.hash.split("?")[1] ?? "";
  const params = validateSearch(Object.fromEntries(new URLSearchParams(query)));
  const root = document.documentElement;
  for (const part of ["skin", "palette", "mode"] as const) {
    const value = params[part];
    if (value === undefined) continue;
    try {
      localStorage.setItem(`${THEME.key}.${part}`, value);
    } catch {
      // Without storage the attribute below still applies it for this page.
    }
    root.dataset[part] = value;
  }
}

/** The kit and size of the current address, with the stored choice and the defaults behind them. */
export function useView(): {
  kit: Kit;
  size: Size;
  setKit: (kit: Kit) => void;
  setSize: (size: Size) => void;
} {
  const search = useSearch({ strict: false }) as SiteSearch;
  const navigate = useNavigate();
  const kit = search.kit ?? read("kit", KITS) ?? "react";
  const size = search.size ?? read("size", SIZES) ?? "fit";
  return {
    kit,
    size,
    setKit: (next) => {
      write("kit", next);
      void navigate({ to: ".", search: (prev: SiteSearch) => ({ ...prev, kit: next }) });
    },
    setSize: (next) => {
      write("size", next);
      void navigate({ to: ".", search: (prev: SiteSearch) => ({ ...prev, size: next }) });
    },
  };
}

/** Keeps the address and the stored choice in step with the view, and the theme in step with the address. */
export function useAddressSync(): void {
  const search = useSearch({ strict: false }) as SiteSearch;
  const navigate = useNavigate();
  const theme = useTheme();
  const { kit, size } = useView();

  // The view and the theme into the address, so every view is a link.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs when the view or the theme changes; a change of the address alone is the effect below.
  useEffect(() => {
    write("kit", kit);
    write("size", size);
    if (
      search.kit === kit &&
      search.size === size &&
      search.skin === theme.skin &&
      search.palette === theme.palette &&
      search.mode === theme.mode
    )
      return;
    void navigate({
      to: ".",
      replace: true,
      search: (prev: SiteSearch) => ({
        ...prev,
        kit,
        size,
        skin: theme.skin,
        palette: theme.palette,
        mode: theme.mode,
      }),
    });
  }, [kit, size, theme.skin, theme.palette, theme.mode]);

  // An address typed or pasted later sets the theme.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs when the address changes only.
  useEffect(() => {
    const change = { skin: search.skin, palette: search.palette, mode: search.mode };
    if (change.skin || change.palette || change.mode) theme.set(change);
  }, [search.skin, search.palette, search.mode]);
}

/** Sends the theme into a frame of the same origin; both kits' theme objects there follow the event. */
export function sendTheme(frame: HTMLIFrameElement, state: ThemeState): void {
  const win = frame.contentWindow as (Window & typeof globalThis) | null;
  const doc = frame.contentDocument;
  if (!win || !doc?.documentElement) return;
  const root = doc.documentElement;
  if (
    root.dataset.skin === state.skin &&
    root.dataset.palette === state.palette &&
    root.dataset.mode === state.mode
  )
    return;
  root.dataset.skin = state.skin;
  root.dataset.palette = state.palette;
  root.dataset.mode = state.mode;
  doc.dispatchEvent(new win.CustomEvent(THEME_EVENT, { detail: state }));
}

/** The theme parameters of a frame's address, so it paints in the right theme from the start. */
export const themeQuery = (state: ThemeState): string =>
  `skin=${encodeURIComponent(state.skin)}&palette=${encodeURIComponent(state.palette)}&mode=${state.mode}`;

export const SIDEBAR_KEY = "tailor-showcase.sidenav";
