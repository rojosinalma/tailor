/**
 * The page checks: every showcase page, in every skin and at every width, is opened in the browser and
 * checked for sideways scroll, cut text, overlapping controls, touch size, accessibility and page errors.
 * The same pass takes the images and compares them with the reference hashes.
 */
import { createHash } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { AxeBuilder } from "@axe-core/playwright";
import type { Browser, BrowserContext, Page } from "playwright";
import { at } from "../../bin/lib/paths";
import type { ComponentSpec } from "../../core/src/spec";
import type { Kit } from "./behaviour";
import { connectBrowser, pool, WORKERS } from "./browser";

/** The four widths of the checks: a phone, a tablet and two desktops. The first two are touch screens. */
export const WIDTHS = [390, 820, 1440, 1920] as const;
const TOUCH_WIDTHS: readonly number[] = [390, 820];
const HEIGHT = 900;
/** The pages show this moment, so a date or "2 hours ago" never changes an image. */
const FIXED_NOW = new Date("2026-11-15T12:00:00Z");
const TOUCH = 44;
/** The accessibility target: WCAG 2.2 level AA. */
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

export interface PagesOptions {
  readonly siteUrl: string;
  readonly specs: readonly ComponentSpec[];
  readonly skins: readonly string[];
  readonly palettes: readonly string[];
  readonly defaultSkin: string;
  readonly defaultPalette: string;
  /** Only these components. Leave out for all. */
  readonly only?: ReadonlySet<string>;
  /** Only these skins. Leave out for all. */
  readonly onlySkins?: ReadonlySet<string>;
  readonly widths?: readonly number[];
  /** Run the palette sweep: every palette and mode, for the entries that show the most colour. */
  readonly sweep?: boolean;
  /** Take and compare images. Off for a quick run that only checks the pages. */
  readonly images?: boolean;
  /** Use the hash of an image from the local cache when nothing that draws it changed. */
  readonly skipKnown?: boolean;
  /** Accept new and changed images as the reference. */
  readonly update?: boolean;
  readonly axe?: boolean;
}

export interface PageProblem {
  readonly page: string;
  readonly state: string;
  readonly rule: string;
  readonly message: string;
}

export interface PagesResult {
  readonly pages: number;
  readonly states: number;
  readonly problems: PageProblem[];
  readonly images: { taken: number; skipped: number; changed: string[]; added: string[]; removed: string[] };
}

const sha = (data: string | Uint8Array): string =>
  createHash("sha256").update(data).digest("hex").slice(0, 20);

const REFERENCE = "checks/images.json";
const CACHE = "checks/.results/fingerprints.json";

async function readJson<T>(path: string, fallback: T): Promise<T> {
  const file = Bun.file(at(path));
  return (await file.exists()) ? ((await file.json()) as T) : fallback;
}

async function writeFile(path: string, content: string | Uint8Array): Promise<void> {
  await mkdir(dirname(at(path)), { recursive: true });
  await Bun.write(at(path), content);
}

/** Runs in the page: finds what a person would have to correct by hand. */
function inspect(touch: boolean, touchSize: number): { rule: string; message: string }[] {
  const problems: { rule: string; message: string }[] = [];
  const name = (el: Element): string => {
    const cls =
      typeof el.className === "string" && el.className ? `.${el.className.split(/\s+/).join(".")}` : "";
    const text = (el.textContent ?? "").trim().slice(0, 30);
    return `${el.tagName.toLowerCase()}${cls}${text ? ` "${text}"` : ""}`;
  };
  const visible = (el: Element): boolean => {
    const rect = el.getBoundingClientRect();
    // A box of one pixel is a visually hidden element, such as a native control behind a drawn one.
    if (rect.width <= 1 || rect.height <= 1) return false;
    const style = getComputedStyle(el);
    return style.visibility !== "hidden" && style.display !== "none" && Number(style.opacity) > 0;
  };
  const allowsScrollX = (el: Element): boolean => {
    for (let node: Element | null = el; node; node = node.parentElement) {
      const overflow = getComputedStyle(node).overflowX;
      if (overflow === "auto" || overflow === "scroll") return true;
    }
    return false;
  };

  const doc = document.documentElement;
  if (doc.scrollWidth > doc.clientWidth + 1) {
    problems.push({
      rule: "sideways-scroll",
      message: `the page is ${doc.scrollWidth}px wide in a ${doc.clientWidth}px window`,
    });
  }

  const interactive =
    "button, a[href], input:not([type=hidden]), select, textarea, summary, [role=button], [role=tab], [role=option], [role=menuitem], [role=switch], [role=checkbox], [role=radio], [role=slider], [role=combobox]";
  const controls: { el: Element; rect: DOMRect }[] = [];
  for (const el of document.querySelectorAll("body *")) {
    if (!visible(el)) continue;
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);

    if (rect.right > doc.clientWidth + 1 && !allowsScrollX(el) && style.position !== "fixed") {
      problems.push({
        rule: "beyond-edge",
        message: `${name(el)} reaches ${Math.round(rect.right - doc.clientWidth)}px past the right edge`,
      });
    }
    const clips = style.overflowX === "hidden" || style.overflowX === "clip";
    if (
      clips &&
      el.scrollWidth > el.clientWidth + 1 &&
      style.textOverflow !== "ellipsis" &&
      !el.querySelector("*")
    ) {
      problems.push({
        rule: "cut-text",
        message: `${name(el)} cuts its text (${el.scrollWidth}px in ${el.clientWidth}px) with no ellipsis`,
      });
    }
    if (
      el.matches(interactive) &&
      !el.closest("[aria-hidden=true]") &&
      !(el instanceof HTMLInputElement && el.tabIndex < 0)
    ) {
      controls.push({ el, rect });
    }
  }

  for (let i = 0; i < controls.length; i++) {
    const a = controls[i];
    if (!a) continue;
    for (let j = i + 1; j < controls.length; j++) {
      const b = controls[j];
      if (!b || a.el.contains(b.el) || b.el.contains(a.el)) continue;
      const w = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left);
      const h = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top);
      if (w > 4 && h > 4)
        problems.push({
          rule: "overlap",
          message: `${name(a.el)} and ${name(b.el)} overlap by ${Math.round(w)}×${Math.round(h)}px`,
        });
    }
  }

  if (touch) {
    for (const { el, rect } of controls) {
      // A link inside a line of text is exempt, as WCAG 2.5.8 allows. A control inside a label counts with its label.
      if (el.tagName === "A" && getComputedStyle(el).display === "inline") continue;
      const label = el.closest("label");
      const box = label ? label.getBoundingClientRect() : rect;
      const hit = el.closest("[data-t-hit]")?.getBoundingClientRect() ?? box;
      // The height is the touch size. The width of a text control follows its text, with the WCAG minimum of 24px.
      if (hit.height < touchSize - 0.5 || hit.width < 24) {
        problems.push({
          rule: "touch-size",
          message: `${name(el)} is ${Math.round(hit.width)}×${Math.round(hit.height)}px; a touch screen needs ${touchSize}px of height and 24px of width`,
        });
      }
    }
  }
  return problems;
}

async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images]
        .filter((img) => !img.complete)
        .map((img) => new Promise((done) => img.addEventListener("load", done, { once: true }))),
    );
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(() => done(null))));
  });
}

interface Target {
  readonly component: string;
  readonly kit: Kit;
  readonly url: string;
}

interface State {
  readonly skin: string;
  readonly palette: string;
  readonly mode: "dark" | "light";
  readonly width: number;
  /** The key of the reference image, or null when this state takes no image. */
  readonly image: string | null;
}

export async function runPages(options: PagesOptions): Promise<PagesResult> {
  const { siteUrl, specs, defaultSkin, defaultPalette } = options;
  const widths = options.widths ?? WIDTHS;
  const skins = options.skins.filter((s) => !options.onlySkins || options.onlySkins.has(s));
  const skinList = skins.length > 0 ? skins : [""];
  const takeImages = options.images ?? true;

  const targets: Target[] = [];
  for (const spec of specs) {
    if (options.only && !options.only.has(spec.id)) continue;
    targets.push({ component: spec.id, kit: "react", url: `entry.html?id=${spec.id}` });
    if (spec.html !== "none") targets.push({ component: spec.id, kit: "html", url: `html/${spec.id}.html` });
  }

  const statesFor = (target: Target): State[] => {
    const states: State[] = [];
    for (const skin of skinList) {
      for (const width of widths) {
        // The React kit's images are the reference. The HTML kit's images are compared with them (parity).
        const image = takeImages ? `${target.kit}/${target.component}/${skin || "none"}/${width}` : null;
        states.push({ skin, palette: defaultPalette, mode: "dark", width, image });
      }
    }
    if (options.sweep && target.kit === "react") {
      for (const palette of options.palettes) {
        for (const mode of ["dark", "light"] as const) {
          if (palette === defaultPalette && mode === "dark") continue;
          const image = takeImages ? `react/${target.component}/palette/${palette}-${mode}` : null;
          states.push({
            skin: skinList.includes(defaultSkin) ? defaultSkin : (skinList[0] ?? ""),
            palette,
            mode,
            width: 1440,
            image,
          });
        }
      }
    }
    return states;
  };

  const reference = await readJson<Record<string, string>>(REFERENCE, {});
  const cache = await readJson<Record<string, string>>(CACHE, {});
  const stylesheets =
    sha(await Bun.file(at("showcase/dist/assets/all.css")).text()) +
    sha(await Bun.file(at("showcase/dist/assets/showcase.css")).text());

  const problems: PageProblem[] = [];
  const taken = new Map<string, string>();
  let skipped = 0;
  let states = 0;

  const browser: Browser = await connectBrowser();
  const version = browser.version();
  try {
    await pool(targets, WORKERS, async (target) => {
      const all = statesFor(target);
      for (const touch of [true, false]) {
        const mine = all.filter((s) => TOUCH_WIDTHS.includes(s.width) === touch);
        const first = mine[0];
        if (!first) continue;
        const context: BrowserContext = await browser.newContext({
          viewport: { width: first.width, height: HEIGHT },
          hasTouch: touch,
          isMobile: touch,
          reducedMotion: "reduce",
          colorScheme: "dark",
          locale: "en-US",
          timezoneId: "UTC",
        });
        await context.addInitScript({ content: `window.__inspect = ${inspect.toString()};` });
        const page = await context.newPage();
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(String(error)));
        page.on("console", (message) => {
          if (message.type() === "error") errors.push(message.text());
        });
        try {
          await page.clock.setFixedTime(FIXED_NOW);
          const join = target.url.includes("?") ? "&" : "?";
          await page.goto(
            `${siteUrl}${target.url}${join}skin=${first.skin}&palette=${first.palette}&mode=${first.mode}`,
          );
          await page.locator(".sc-example").first().waitFor();
          let dom = "";
          for (const state of mine) {
            states++;
            const label = `${state.skin || "no skin"} ${state.palette} ${state.mode} ${state.width}px`;
            await page.evaluate(({ skin, palette, mode }) => {
              const root = document.documentElement;
              root.dataset.skin = skin;
              root.dataset.palette = palette;
              root.dataset.mode = mode;
            }, state);
            await page.setViewportSize({ width: state.width, height: HEIGHT });
            await settle(page);
            const found = await page.evaluate(
              ([isTouch, size]) =>
                (window as unknown as { __inspect: typeof inspect }).__inspect(isTouch, size),
              [touch, TOUCH] as const,
            );
            for (const problem of found)
              problems.push({ page: `${target.kit}/${target.component}`, state: label, ...problem });
            if (state.image) {
              dom ||= sha(await page.evaluate(() => document.body.innerHTML));
              const fingerprint = sha(
                [version, stylesheets, dom, state.skin, state.palette, state.mode, state.width, touch].join(
                  "|",
                ),
              );
              const known = options.skipKnown ? cache[`${state.image}@${fingerprint}`] : undefined;
              if (known) {
                taken.set(state.image, known);
                skipped++;
              } else {
                const png = await page.screenshot({ fullPage: true, animations: "disabled", caret: "hide" });
                const hash = sha(png);
                taken.set(state.image, hash);
                cache[`${state.image}@${fingerprint}`] = hash;
                if (reference[state.image] !== hash)
                  await writeFile(`checks/.images/${state.image}.png`, png);
              }
            }
          }
          if (options.axe && !touch) {
            const { violations } = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
            for (const violation of violations) {
              const where = violation.nodes
                .slice(0, 3)
                .map((n) => n.target.join(" "))
                .join("; ");
              problems.push({
                page: `${target.kit}/${target.component}`,
                state: "accessibility",
                rule: `axe:${violation.id}`,
                message: `${violation.help} (${where})`,
              });
            }
          }
          for (const error of errors)
            problems.push({
              page: `${target.kit}/${target.component}`,
              state: "load",
              rule: "page-error",
              message: error,
            });
        } catch (error) {
          problems.push({
            page: `${target.kit}/${target.component}`,
            state: "load",
            rule: "page-error",
            message: error instanceof Error ? (error.message.split("\n")[0] ?? "") : String(error),
          });
        } finally {
          await context.close();
        }
      }
    });
  } finally {
    await browser.close();
  }

  // Compare the images with the reference. The HTML kit must draw what the React kit draws.
  const changed: string[] = [];
  const added: string[] = [];
  const next: Record<string, string> = { ...reference };
  for (const [key, hash] of taken) {
    if (key.startsWith("html/")) {
      const twin = taken.get(key.replace(/^html\//, "react/"));
      if (twin && twin !== hash) {
        problems.push({
          page: key,
          state: "parity",
          rule: "kit-parity",
          message: "the HTML kit and the React kit draw this page differently (see checks/.images)",
        });
      }
      continue;
    }
    if (!(key in reference)) added.push(key);
    else if (reference[key] !== hash) changed.push(key);
    next[key] = hash;
  }
  const full = !options.only && !options.onlySkins && !options.widths;
  const removed =
    full && takeImages
      ? Object.keys(reference).filter(
          (key) => !taken.has(key) && (options.sweep || !key.includes("/palette/")),
        )
      : [];
  for (const key of removed) delete next[key];

  if (takeImages) {
    await writeFile(CACHE, JSON.stringify(cache));
    if (options.update) {
      const sorted = Object.fromEntries(Object.entries(next).sort(([a], [b]) => a.localeCompare(b)));
      await writeFile(
        REFERENCE,
        `${JSON.stringify(sorted, null, 0).replaceAll('","', '",\n"').replace("{", "{\n").replace(/}$/, "\n}")}\n`,
      );
    } else {
      for (const key of changed)
        problems.push({
          page: key,
          state: "image",
          rule: "image-changed",
          message:
            "the image differs from the reference; look at checks/.images, then accept with --update-images",
        });
      for (const key of added)
        problems.push({
          page: key,
          state: "image",
          rule: "image-new",
          message: "no reference image yet; accept with --update-images",
        });
    }
  }

  return {
    pages: targets.length,
    states,
    problems,
    images: { taken: taken.size - skipped, skipped, changed, added, removed },
  };
}
