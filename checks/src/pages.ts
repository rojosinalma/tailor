/**
 * The page checks: every showcase page, in every skin and at every width, is opened in the browser and
 * checked for sideways scroll, cut text, overlapping controls, touch size, accessibility and page errors.
 * The same pass takes the images and compares them with the reference hashes.
 */
import { createHash } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { inflateSync } from "node:zlib";
import type { Browser, BrowserContext, Page } from "playwright";
import { at } from "../../bin/lib/paths";
import type { ComponentSpec } from "../../core/src/spec";
import type { Kit } from "./behaviour";
import { connectBrowser, FIXED_NOW, pool, WORKERS } from "./browser";
import { COLOURFUL } from "./colourful";

/** A screen of the checks. An image is named by the name of its screen. */
export interface Screen {
  readonly name: string;
  readonly width: number;
  readonly height: number;
  readonly touch: boolean;
}

/**
 * The screens of the checks: a phone, a tablet upright and on its side, and two desktops; the phone and
 * the tablet are touch screens. The component pages take these five, named by their width. The sample apps
 * also take a large desktop and a short desktop window, where a page that grows past the screen shows.
 */
export const SCREENS: readonly Screen[] = [
  { name: "390", width: 390, height: 844, touch: true },
  { name: "820", width: 820, height: 1180, touch: true },
  { name: "1180", width: 1180, height: 820, touch: true },
  { name: "1440", width: 1440, height: 900, touch: false },
  { name: "1920", width: 1920, height: 1080, touch: false },
  { name: "2560", width: 2560, height: 1440, touch: false },
  { name: "1440x800", width: 1440, height: 800, touch: false },
];
export const WIDTHS: readonly number[] = [390, 820, 1180, 1440, 1920];
const screenOf = (name: string): Screen => {
  const screen = SCREENS.find((s) => s.name === name);
  if (!screen) throw new Error(`no screen named ${name}`);
  return screen;
};
export const TOUCH = 44;
const ICON_WAIT = 10_000;

/** What a dropped connection or a page that never arrived looks like in a page error. */
const TRANSIENT = /ERR_NETWORK_CHANGED|ERR_CONNECTION|Timeout \d+ms exceeded/;

/** The part of the accessibility engine that the check calls in the page. */
interface AxeEngine {
  run(
    context: Document,
    options: { runOnly: string[]; resultTypes: string[] },
  ): Promise<{ violations: { id: string; help: string; nodes: { target: string[] }[] }[] }>;
}

/** The accessibility target: WCAG 2.2 level AA. */
export const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/** One page of a sample app to check, in the React kit and, when the shell has one, the HTML kit. */
export interface AppCheck {
  readonly shell: string;
  readonly id: string;
  readonly html: boolean;
  /** The names of its screens. */
  readonly screens: readonly string[];
  /** The screens that it takes in the default skin only. */
  readonly defaultSkinOnly: readonly string[];
  /** The addresses of the page, relative to the site root. */
  readonly react: string;
  readonly htmlUrl: string;
}

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
  /** The pages of the sample apps. They run when no component is named (`only` is left out). */
  readonly apps?: readonly AppCheck[];
  /** Run the palette sweep: every palette and mode, for the entries that show the most colour. */
  readonly sweep?: boolean;
  /** Take and compare images. Off for a quick run that only checks the pages. */
  readonly images?: boolean;
  /** Use the hash of an image from the local cache when nothing that draws it changed. */
  readonly skipKnown?: boolean;
  /** A page with no reference image yet is not a problem. For work on a new component. */
  readonly allowNew?: boolean;
  /** Do not compare with the reference images; the two kits are still compared with each other. */
  readonly noReference?: boolean;
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

/**
 * The hash of the pixels of a PNG file. The browser does not always compress the same pixels to the same
 * bytes, so the hash is taken from the image data after it is unpacked, not from the file.
 */
export function pixelHash(png: Uint8Array): string {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  const hash = createHash("sha256");
  const data: Uint8Array[] = [];
  for (let at = 8; at < png.length; ) {
    const length = view.getUint32(at);
    const type = String.fromCharCode(...png.subarray(at + 4, at + 8));
    const body = png.subarray(at + 8, at + 8 + length);
    if (type === "IHDR") hash.update(body);
    else if (type === "IDAT") data.push(body);
    at += 12 + length;
  }
  hash.update(inflateSync(Buffer.concat(data)));
  return hash.digest("hex").slice(0, 20);
}

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

/** The pixels of a PNG file (8-bit RGB or RGBA, as the browser writes them), row after row. */
function decodePng(png: Uint8Array): {
  width: number;
  height: number;
  channels: number;
  data: Uint8Array;
} {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  const chunks: Uint8Array[] = [];
  let width = 0;
  let height = 0;
  let channels = 3;
  for (let at = 8; at < png.length; ) {
    const length = view.getUint32(at);
    const type = String.fromCharCode(...png.subarray(at + 4, at + 8));
    if (type === "IHDR") {
      width = view.getUint32(at + 8);
      height = view.getUint32(at + 12);
      channels = png[at + 17] === 6 ? 4 : 3;
    } else if (type === "IDAT") chunks.push(png.subarray(at + 8, at + 8 + length));
    at += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(chunks));
  const stride = width * channels;
  const data = new Uint8Array(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)] ?? 0;
    const row = y * stride;
    for (let x = 0; x < stride; x++) {
      const value = raw[y * (stride + 1) + 1 + x] ?? 0;
      const left = x >= channels ? (data[row + x - channels] ?? 0) : 0;
      const up = y > 0 ? (data[row - stride + x] ?? 0) : 0;
      const corner = y > 0 && x >= channels ? (data[row - stride + x - channels] ?? 0) : 0;
      let predicted = 0;
      if (filter === 1) predicted = left;
      else if (filter === 2) predicted = up;
      else if (filter === 3) predicted = (left + up) >> 1;
      else if (filter === 4) {
        const [a, b, c] = [Math.abs(up - corner), Math.abs(left - corner), Math.abs(left + up - 2 * corner)];
        predicted = a <= b && a <= c ? left : b <= c ? up : corner;
      }
      data[row + x] = (value + predicted) & 255;
    }
  }
  return { width, height, channels, data };
}

/**
 * The browser draws the edge of a rounded corner or of a small icon a little differently from run to run
 * in a few places. Two images count as the same when they have the same size, at most NOISE_PIXELS pixels
 * differ at all, and at most NOISE_STRONG of them by more than NOISE_LEVELS in a colour channel.
 * A real change, even a one-pixel shift of a border or another icon, moves more pixels than that.
 */
const NOISE_PIXELS = 150;
const NOISE_STRONG = 40;
const NOISE_LEVELS = 6;

export function sameImage(a: Uint8Array, b: Uint8Array): boolean {
  const [x, y] = [decodePng(a), decodePng(b)];
  if (x.width !== y.width || x.height !== y.height || x.channels !== y.channels) return false;
  let differing = 0;
  let strong = 0;
  for (let i = 0; i < x.data.length; i += x.channels) {
    let delta = 0;
    for (let c = 0; c < x.channels; c++) {
      delta = Math.max(delta, Math.abs((x.data[i + c] ?? 0) - (y.data[i + c] ?? 0)));
    }
    if (delta === 0) continue;
    if (++differing > NOISE_PIXELS) return false;
    if (delta > NOISE_LEVELS && ++strong > NOISE_STRONG) return false;
  }
  return true;
}

/** Two images of the checks, by their keys: the same hash, or the same picture apart from drawing noise. */
async function sameByKey(
  a: string,
  b: string,
  hashes: ReadonlyMap<string, string>,
  fileB = `checks/.images/${b}.png`,
): Promise<boolean> {
  if (hashes.get(a) !== undefined && hashes.get(a) === hashes.get(b)) return true;
  const [first, second] = [Bun.file(at(`checks/.images/${a}.png`)), Bun.file(at(fileB))];
  if (!(await first.exists()) || !(await second.exists())) return false;
  return sameImage(await first.bytes(), await second.bytes());
}

/** Runs in the page: finds what a person would have to correct by hand. */
export function inspect(touch: boolean, touchSize: number): { rule: string; message: string }[] {
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
    if (style.visibility === "hidden" || style.display === "none" || Number(style.opacity) === 0)
      return false;
    // An element that an ancestor scrolled out of sight or clipped away is not on the screen.
    for (let node = el.parentElement; node; node = node.parentElement) {
      if (getComputedStyle(node).overflow === "visible") continue;
      const box = node.getBoundingClientRect();
      if (
        rect.right <= box.left + 1 ||
        rect.left >= box.right - 1 ||
        rect.bottom <= box.top + 1 ||
        rect.top >= box.bottom - 1
      ) {
        return false;
      }
    }
    return true;
  };
  const doc = document.documentElement;
  const allowsScrollX = (el: Element): boolean => {
    for (let node: Element | null = el; node; node = node.parentElement) {
      const overflow = getComputedStyle(node).overflowX;
      if (overflow === "auto" || overflow === "scroll") return true;
      // Content that an ancestor clips shows no further than that ancestor.
      const clips = node !== el && (overflow === "hidden" || overflow === "clip");
      if (clips && node.getBoundingClientRect().right <= doc.clientWidth + 1) return true;
    }
    return false;
  };

  if (doc.scrollWidth > doc.clientWidth + 1) {
    problems.push({
      rule: "sideways-scroll",
      message: `the page is ${doc.scrollWidth}px wide in a ${doc.clientWidth}px window`,
    });
  }

  // A fill page takes the screen and never scrolls: only the panes inside it may. On a page narrower than
  // 40rem (a phone) the body scrolls as one column by design, so the rule holds for wider pages only.
  const rem = Number.parseFloat(getComputedStyle(doc).fontSize) || 16;
  for (const body of document.querySelectorAll('.t-page[data-mode="fill"] > .t-page-body')) {
    const page = body.parentElement;
    if (!page || !visible(page) || page.getBoundingClientRect().width < 40 * rem) continue;
    if (body.scrollHeight > body.clientHeight + 1) {
      const title = (page.querySelector(".t-page-title")?.textContent ?? "").trim().slice(0, 30);
      problems.push({
        rule: "fill-body-scroll",
        message: `the body of the fill page "${title}" holds ${body.scrollHeight}px in ${body.clientHeight}px; only the panes inside a fill page may scroll`,
      });
    }
  }

  const interactive =
    "button, a[href], input:not([type=hidden]), select, textarea, summary, [role=button], [role=tab], [role=option], [role=menuitem], [role=switch], [role=checkbox], [role=radio], [role=slider], [role=combobox]";
  const controls: { el: Element; rect: DOMRect }[] = [];
  // While a modal dialog is open, the page under it takes no input: only the controls in the dialog count.
  const modal = document.querySelector(":modal");
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
    // A text field scrolls its own text, so a long value is not cut.
    const field = el.tagName === "INPUT" || el.tagName === "TEXTAREA";
    if (
      !field &&
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
      !(el instanceof HTMLInputElement && el.tabIndex < 0) &&
      (!modal || modal.contains(el))
    ) {
      controls.push({ el, rect });
    }
  }

  // Content cut by a box around it. A box that clips (overflow hidden or clip) hides what reaches past its
  // edge, unless it says so with an ellipsis or a line clamp. A box that scrolls in both directions (a pane, a
  // page region) is not meant to scroll sideways: what reaches past its side is cut in the picture, unless it is
  // preformatted text (code, a log). A box that scrolls sideways only (overflow-y hidden: a tab strip, a table
  // in its scroll form, a code block) scrolls by design. The walk stops at the nearest box that scrolls.
  const isText = (el: Element): boolean =>
    [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? "").trim() !== "");
  for (const el of document.querySelectorAll("body *")) {
    const own = getComputedStyle(el);
    if (own.position === "fixed") continue;
    if (!(isText(el) || el.matches(interactive)) || !visible(el)) continue;
    if (el.closest("[aria-hidden=true], .t-skeleton")) continue;
    const rect = el.getBoundingClientRect();
    let absolute = own.position === "absolute";
    let found: string | null = null;
    for (let node = el.parentElement; node && node !== document.body && !found; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (node.matches(":modal, :popover-open")) break;
      // An absolutely placed element is clipped only from its containing block (a placed ancestor) up.
      if (absolute && style.position === "static") continue;
      absolute = style.position === "absolute";
      if (style.position === "fixed") break;
      const [x, y] = [style.overflowX, style.overflowY];
      if (x === "visible" && y === "visible") continue;
      const box = node.getBoundingClientRect();
      const past = {
        left: box.left - rect.left,
        right: rect.right - box.right,
        top: box.top - rect.top,
        bottom: rect.bottom - box.bottom,
      };
      const sideways = Math.max(past.left, past.right);
      const scrolls = (v: string): boolean => v === "auto" || v === "scroll";
      if (scrolls(x) || scrolls(y)) {
        const preformatted = own.whiteSpace === "pre";
        if (scrolls(x) && scrolls(y) && sideways > 1 && !preformatted)
          found = `${name(el)} reaches ${Math.round(sideways)}px past the side of ${name(node).split(" ")[0]}, which scrolls in both directions; it is cut in the picture`;
        break;
      }
      const marked = style.textOverflow === "ellipsis" || style.webkitLineClamp !== "none";
      const cut = Math.max(
        x === "visible" ? 0 : sideways,
        y === "visible" ? 0 : Math.max(past.top, past.bottom),
      );
      if (cut > 1 && !marked)
        found = `${name(el)} is cut by ${name(node).split(" ")[0]}: it reaches ${Math.round(cut)}px past its edge`;
    }
    if (found) problems.push({ rule: "clipped", message: found });
  }

  // A word breaks only where a person would break it: after a hyphen, a dot, a slash or a low line, never in
  // the middle; in a table cell a short one (at most 8 characters, such as a host "web-1") stays whole ("nas-document" over "s", "€12,48" over "0"). A word longer than 16
  // characters is a path, an address or a name with no place to break: it may break anywhere. Code and logs
  // (preformatted text) break where they must.
  const lineWidth = (el: Element): number => {
    const style = getComputedStyle(el);
    const block = style.display === "inline" ? (el.parentElement ?? el) : el;
    const b = getComputedStyle(block);
    return block.clientWidth - Number.parseFloat(b.paddingLeft) - Number.parseFloat(b.paddingRight);
  };
  const wordWidth = (node: Node, from: number, length: number): number => {
    const range = document.createRange();
    let width = 0;
    for (let i = from; i < from + length; i++) {
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      width += range.getBoundingClientRect().width;
    }
    return width;
  };
  const textBoxes = new Set<Element>();
  for (const node of document.querySelectorAll("body *")) {
    if ([...node.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && /\S{2}/.test(n.textContent ?? "")))
      textBoxes.add(node);
  }
  for (const cell of textBoxes) {
    if (cell.closest("pre, code, kbd, samp, textarea, [aria-hidden=true]")) continue;
    // Text for screen readers only sits in a box of one pixel.
    let hidden = false;
    for (let up: Element | null = cell; up && !hidden; up = up.parentElement) {
      const box = up.getBoundingClientRect();
      hidden = box.width <= 1 || box.height <= 1 || getComputedStyle(up).clipPath === "inset(50%)";
    }
    if (hidden) continue;
    if (/^pre/.test(getComputedStyle(cell).whiteSpace) || !visible(cell)) continue;
    for (const node of cell.childNodes) {
      if (node.nodeType !== Node.TEXT_NODE) continue;
      const text = node.textContent ?? "";
      const range = document.createRange();
      const lines = (from: number, to: number): number => {
        range.setStart(node, from);
        range.setEnd(node, to);
        const tops: number[] = [];
        for (const r of range.getClientRects())
          if (r.width > 0 && !tops.some((top) => Math.abs(top - r.top) < r.height / 2)) tops.push(r.top);
        return tops.length;
      };
      // Most text stays on one line: only a text that wraps is looked at word by word.
      if (lines(0, text.length) < 2) continue;
      for (const match of text.matchAll(/\S+/g)) {
        const word = match[0];
        if (word.length < 2 || word.length > 16) continue;
        const at = match.index ?? 0;
        if (lines(at, at + word.length) < 2) continue;
        let lastTop: number | null = null;
        for (let i = 0; i < word.length; i++) {
          range.setStart(node, at + i);
          range.setEnd(node, at + i + 1);
          const rect = range.getClientRects()[0];
          if (!rect || rect.width === 0) continue;
          if (lastTop !== null && rect.top > lastTop + rect.height / 2) {
            const before = word[i - 1] ?? "";
            // In a table cell a short name stays whole; in running text it may break after its hyphen. A word
            // wider than the whole line of its box cannot fit: outside a table (whose columns share the room)
            // it breaks where it must.
            const inTable = cell.closest(".t-table td, .t-table th") !== null;
            const short = word.length <= 8 && inTable;
            const fits = inTable || lineWidth(cell) >= wordWidth(node, at, word.length);
            if (fits && (short || !/[-./_]/.test(before))) {
              problems.push({
                rule: "broken-word",
                message: `${name(cell).split(" ")[0]} breaks "${word}" after "${word.slice(0, i)}"`,
              });
              break;
            }
          }
          lastTop = rect.top;
        }
      }
    }
  }

  // Text in a bar of the frame keeps the gutter from the side of the screen: an icon button at the edge has
  // room of its own, plain text has none ("Ready" 8 px from the edge of a phone).
  for (const bar of document.querySelectorAll(".t-shell-bar, .t-shell-footer")) {
    if (!visible(bar)) continue;
    const edge = bar.getBoundingClientRect();
    for (const node of textBoxes) {
      if (!bar.contains(node) || !visible(node) || node.closest("button, .t-btn, .t-control, [role=search]"))
        continue;
      const box = node.getBoundingClientRect();
      const gap = Math.min(box.left - edge.left, edge.right - box.right);
      if (gap < 12)
        problems.push({
          rule: "edge-text",
          message: `${name(node).split(" ")[0]} "${(node.textContent ?? "").trim().slice(0, 20)}" is ${Math.round(gap)}px from the side of its bar; text keeps the gutter`,
        });
    }
  }

  // The boxes of an element as they show: one per line of a wrapped link, cut to every ancestor that clips or scrolls.
  const shown = (el: Element): { left: number; right: number; top: number; bottom: number }[] => {
    const boxes = [...el.getClientRects()].map((r) => ({
      left: r.left,
      right: r.right,
      top: r.top,
      bottom: r.bottom,
    }));
    for (let node = el.parentElement; node; node = node.parentElement) {
      if (getComputedStyle(node).overflow === "visible") continue;
      const clip = node.getBoundingClientRect();
      for (const box of boxes) {
        box.left = Math.max(box.left, clip.left);
        box.right = Math.min(box.right, clip.right);
        box.top = Math.max(box.top, clip.top);
        box.bottom = Math.min(box.bottom, clip.bottom);
      }
    }
    return boxes;
  };

  // An open popup that is not modal (a popover, a menu, a select's list, a dialog opened with show()) lies
  // over the page by design: a control under it is covered, not overlapped. The popup's own controls still
  // count among themselves, and the page's among themselves.
  const POPUP = ":popover-open, dialog[open]:not(:modal), .t-popup-positioner";
  const layerOf = (el: Element): Element | null => el.closest(POPUP);
  for (let i = 0; i < controls.length; i++) {
    const a = controls[i];
    if (!a) continue;
    for (let j = i + 1; j < controls.length; j++) {
      const b = controls[j];
      if (!b || a.el.contains(b.el) || b.el.contains(a.el)) continue;
      if (layerOf(a.el) !== layerOf(b.el)) continue;
      // A link that wraps has one box per line, so the boxes are compared line by line.
      let worst: [number, number] | null = null;
      for (const ra of shown(a.el)) {
        for (const rb of shown(b.el)) {
          const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
          const h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
          if (w > 4 && h > 4 && (!worst || w * h > worst[0] * worst[1])) worst = [w, h];
        }
      }
      if (worst)
        problems.push({
          rule: "overlap",
          message: `${name(a.el)} and ${name(b.el)} overlap by ${Math.round(worst[0])}×${Math.round(worst[1])}px`,
        });
    }
  }

  if (touch) {
    // The real hit area counts: a label around a control, a field box around its input, or an area that the
    // component adds around a small icon. So a control that looks too small is probed at the edge of the touch size.
    const owns = (el: Element, x: number, y: number): boolean => {
      const hit = document.elementFromPoint(x, y);
      if (!hit) return false;
      if (hit === el || el.contains(hit)) return true;
      // An open popup covers this part of the control: what is under it is not measured.
      const cover = layerOf(hit);
      if (cover && !cover.contains(el)) return true;
      const label = hit.closest("label");
      if (label && (label.contains(el) || label.control === el)) return true;
      return hit.closest(".t-control, [data-t-hit]")?.contains(el) ?? false;
    };
    const moved = new Map<Element, [number, number]>();
    for (const { el, rect } of controls) {
      // A link inside a line of text is exempt, as WCAG 2.5.8 allows.
      if (el.tagName === "A" && getComputedStyle(el).display === "inline") continue;
      if (rect.height >= touchSize - 0.5 && rect.width >= 24) continue;
      // The probe scrolls the control into view. Every box it moves is put back afterwards.
      for (let node = el.parentElement; node; node = node.parentElement) {
        if (!moved.has(node)) moved.set(node, [node.scrollLeft, node.scrollTop]);
      }
      el.scrollIntoView({ block: "center", inline: "center" });
      const now = el.getBoundingClientRect();
      const [cx, cy] = [now.left + now.width / 2, now.top + now.height / 2];
      // How far the hit area reaches from the centre of the control, in each direction.
      const extent = (dx: number, dy: number): number => {
        let distance = 0;
        while (distance < touchSize && owns(el, cx + dx * (distance + 2), cy + dy * (distance + 2)))
          distance += 2;
        return distance;
      };
      const tall = extent(0, -1) + extent(0, 1) >= touchSize - 2;
      const wide = extent(-1, 0) + extent(1, 0) >= 24 - 2;
      if (!tall || !wide) {
        problems.push({
          rule: "touch-size",
          message: `${name(el)} is ${Math.round(rect.width)}×${Math.round(rect.height)}px; a touch screen needs a hit area ${touchSize}px high and 24px wide`,
        });
      }
    }
    for (const [node, [left, top]] of moved) node.scrollTo(left, top);
    scrollTo(0, 0);
  }
  return problems;
}

export async function settle(page: Page): Promise<void> {
  // An example that plays something over time (a reply that arrives) marks itself with data-sc-wait until it ends.
  await page
    .waitForFunction(() => !document.querySelector("[data-sc-wait]"), undefined, { timeout: 3000 })
    .catch(() => null);
  await page.evaluate(async () => {
    await document.fonts.ready;
    // Every image is loaded and decoded, also the ones a script added, such as map tiles.
    await Promise.all(
      [...document.images].map((img) =>
        img.complete && img.naturalWidth === 0 ? null : img.decode().catch(() => null),
      ),
    );
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(() => done(null))));
  });
  await iconsDrawn(page);
}

/**
 * An icon from the sprite file draws a moment after its element is made or shown again. Waits until every
 * icon on the screen has its drawing (a box with a size). A page whose icons never draw did not load right.
 */
async function iconsDrawn(page: Page): Promise<void> {
  const drawn = await page.evaluate(async (limit) => {
    const pending = (): boolean =>
      [...document.querySelectorAll<SVGGraphicsElement>("svg.t-icon")].some((svg) => {
        const use = svg.querySelector<SVGGraphicsElement>("use");
        return use !== null && svg.getClientRects().length > 0 && use.getBBox().width === 0;
      });
    for (let waited = 0; pending(); waited += 50) {
      if (waited >= limit) return false;
      await new Promise((done) => setTimeout(done, 50));
    }
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(() => done(null))));
    return true;
  }, ICON_WAIT);
  if (!drawn) throw new Error(`the icons of the page did not draw: Timeout ${ICON_WAIT}ms exceeded.`);
}

/**
 * Takes the picture of the page. On a busy machine the browser can hand out a picture that still shows
 * parts of an older frame (icons that had not arrived yet). So a picture that is not the expected one is
 * confirmed: more pictures are taken, a moment apart, until two in a row are the same.
 */
async function capture(page: Page, expected: string | undefined): Promise<{ png: Uint8Array; hash: string }> {
  const shoot = async (): Promise<{ png: Uint8Array; hash: string }> => {
    const png = await page.screenshot({ fullPage: true, animations: "disabled", caret: "hide" });
    return { png, hash: pixelHash(png) };
  };
  await repaint(page);
  let last = await shoot();
  if (last.hash === expected) return last;
  for (let attempt = 0; attempt < 4; attempt++) {
    await page.waitForTimeout(250);
    const next = await shoot();
    if (next.hash === last.hash || next.hash === expected) return next;
    last = next;
  }
  return last;
}

/**
 * Makes the browser lay out and paint the whole page again. After a change of skin or width the browser
 * repaints only what it thinks changed, and the edges it keeps can differ by a few pixels from a fresh paint.
 */
async function repaint(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const root = document.documentElement;
    root.style.display = "none";
    void root.offsetHeight;
    root.style.display = "";
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(() => done(null))));
  });
  await iconsDrawn(page);
}

interface Target {
  /** The name of the page in its image keys: a component id, or app-<shell>/<page>. */
  readonly component: string;
  readonly kit: Kit;
  readonly url: string;
  /** The element that shows the page is drawn. */
  readonly ready: string;
  readonly screens: readonly Screen[];
  /** The screens that it takes in the default skin only. */
  readonly defaultSkinOnly?: readonly string[];
}

interface State {
  readonly skin: string;
  readonly palette: string;
  readonly mode: "dark" | "light";
  readonly screen: Screen;
  /** The key of the reference image, or null when this state takes no image. */
  readonly image: string | null;
}

export async function runPages(options: PagesOptions): Promise<PagesResult> {
  const { siteUrl, specs, defaultSkin, defaultPalette } = options;
  const screens = (options.widths ?? WIDTHS).map((width) => screenOf(String(width)));
  const skins = options.skins.filter((s) => !options.onlySkins || options.onlySkins.has(s));
  const skinList = skins.length > 0 ? skins : [""];
  const takeImages = options.images ?? true;

  const targets: Target[] = [];
  // The sample apps go first: each takes many states in a row, and the short component pages fill the gaps.
  for (const app of options.only ? [] : (options.apps ?? [])) {
    const page = {
      component: `app-${app.shell}/${app.id}`,
      ready: ".t-shell-main > *",
      screens: app.screens.map(screenOf),
      defaultSkinOnly: app.defaultSkinOnly,
    };
    targets.push({ ...page, kit: "react", url: app.react });
    if (app.html) targets.push({ ...page, kit: "html", url: app.htmlUrl });
  }
  for (const spec of specs) {
    if (options.only && !options.only.has(spec.id)) continue;
    const entry = { component: spec.id, ready: ".sc-example", screens };
    targets.push({ ...entry, kit: "react", url: `entry.html?id=${spec.id}` });
    if (spec.html !== "none") targets.push({ ...entry, kit: "html", url: `html/${spec.id}.html` });
  }

  const statesFor = (target: Target): State[] => {
    const states: State[] = [];
    for (const skin of skinList) {
      for (const screen of target.screens) {
        if (skin !== defaultSkin && target.defaultSkinOnly?.includes(screen.name)) continue;
        // The React kit's images are the reference. The HTML kit's images are compared with them (parity).
        const image = takeImages
          ? `${target.kit}/${target.component}/${skin || "none"}/${screen.name}`
          : null;
        states.push({ skin, palette: defaultPalette, mode: "dark", screen, image });
      }
    }
    if (options.sweep && target.kit === "react" && COLOURFUL.includes(target.component)) {
      for (const palette of options.palettes) {
        for (const mode of ["dark", "light"] as const) {
          if (palette === defaultPalette && mode === "dark") continue;
          const image = takeImages ? `react/${target.component}/palette/${palette}-${mode}` : null;
          states.push({
            skin: skinList.includes(defaultSkin) ? defaultSkin : (skinList[0] ?? ""),
            palette,
            mode,
            screen: screenOf("1440"),
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
        const mine = all.filter((s) => s.screen.touch === touch);
        const first = mine[0];
        if (!first) continue;
        // A change in the machine's network (a container that starts somewhere) makes the browser drop its
        // requests. A page that failed to load for that reason is opened once more; a real fault fails twice.
        for (let attempt = 0; attempt < 2; attempt++) {
          const local: PageProblem[] = [];
          const context: BrowserContext = await browser.newContext({
            viewport: { width: first.screen.width, height: first.screen.height },
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
            // The theme goes into the query, before the address of a page in a hash router.
            const [path = "", hash] = target.url.split("#");
            const join = path.includes("?") ? "&" : "?";
            const address = (state: State): string =>
              `${siteUrl}${path}${join}skin=${state.skin}&palette=${state.palette}&mode=${state.mode}${hash === undefined ? "" : `#${hash}`}`;
            await page.goto(address(first));
            await page.locator(target.ready).first().waitFor();
            let dom = "";
            let loaded = first.skin;
            const reactOnly =
              target.kit === "react" ? await page.locator('.sc-example[data-kit="react"]').count() : 0;
            const fingerprintOf = (state: State): string =>
              sha(
                [
                  version,
                  stylesheets,
                  dom,
                  state.skin,
                  state.palette,
                  state.mode,
                  // A screen named by its width alone has its usual height, so its fingerprint stays as it was.
                  state.screen.name === String(state.screen.width) ? state.screen.width : state.screen.name,
                  touch,
                ].join("|"),
              );
            for (const state of mine) {
              states++;
              // A palette image whose fingerprint is known needs no visit: a palette changes colours only, so
              // the page of the same skin gives the fingerprint. Only a palette image that is not known is taken.
              if (options.skipKnown && dom && state.skin === loaded && state.image?.includes("/palette/")) {
                const fingerprint = fingerprintOf(state);
                const known = cache[`${state.image}@${fingerprint}`];
                const shared = state.image.replace(/^react\//, "shared/");
                const knownShared = reactOnly > 0 ? cache[`${shared}@${fingerprint}`] : "";
                if (known && knownShared !== undefined) {
                  taken.set(state.image, known);
                  if (knownShared) taken.set(shared, knownShared);
                  skipped++;
                  continue;
                }
              }
              const { width, height } = state.screen;
              const size = state.screen.name === String(width) ? `${width}px` : `${width}×${height}px`;
              const label = `${state.skin || "no skin"} ${state.palette} ${state.mode} ${size}`;
              await page.setViewportSize({ width, height });
              if (state.skin !== loaded) {
                // A skin changes sizes and fonts, so the page is loaded again in it, as a person would see it.
                // Palettes and modes change colours only and switch in place.
                await page.goto(address(state));
                await page.locator(target.ready).first().waitFor();
                loaded = state.skin;
                dom = "";
              }
              await page.evaluate(({ skin, palette, mode }) => {
                const root = document.documentElement;
                root.dataset.skin = skin;
                root.dataset.palette = palette;
                root.dataset.mode = mode;
              }, state);
              await settle(page);
              const found = await page.evaluate(
                ([isTouch, size]) =>
                  (window as unknown as { __inspect: typeof inspect }).__inspect(isTouch, size),
                [touch, TOUCH] as const,
              );
              for (const problem of found)
                local.push({ page: `${target.kit}/${target.component}`, state: label, ...problem });
              if (state.image) {
                dom ||= sha(await page.evaluate(() => document.body.innerHTML));
                const fingerprint = fingerprintOf(state);
                const known = options.skipKnown ? cache[`${state.image}@${fingerprint}`] : undefined;
                if (known) {
                  taken.set(state.image, known);
                  skipped++;
                } else {
                  // The picture that is expected: the reference, and for the HTML kit the React kit's reference.
                  const twin = state.image.replace(/^html\//, "react/");
                  const expected = reference[state.image] ?? reference[twin];
                  const { png, hash } = await capture(page, expected);
                  taken.set(state.image, hash);
                  cache[`${state.image}@${fingerprint}`] = hash;
                  await writeFile(`checks/.images/${state.image}.png`, png);
                }
                // Examples that only the React kit can show are left out of the image that the HTML kit is compared with.
                if (reactOnly > 0) {
                  const shared = state.image.replace(/^react\//, "shared/");
                  const knownShared = options.skipKnown ? cache[`${shared}@${fingerprint}`] : undefined;
                  if (knownShared) {
                    taken.set(shared, knownShared);
                  } else {
                    await page
                      .addStyleTag({ content: '.sc-example[data-kit="react"]{display:none}' })
                      .then(async (tag) => {
                        const { png, hash } = await capture(page, undefined);
                        taken.set(shared, hash);
                        cache[`${shared}@${fingerprint}`] = hash;
                        await writeFile(`checks/.images/${shared}.png`, png);
                        await tag.evaluate((node) => (node as Element).remove());
                      });
                  }
                }
              }
            }
            if (options.axe && !touch) {
              await page.addScriptTag({ path: at("node_modules/axe-core/axe.min.js") });
              const violations = await page.evaluate(async (tags) => {
                const axe = (window as unknown as { axe: AxeEngine }).axe;
                const result = await axe.run(document, { runOnly: tags, resultTypes: ["violations"] });
                return result.violations.map((v) => ({
                  id: v.id,
                  help: v.help,
                  targets: v.nodes.slice(0, 3).map((node) => node.target.join(" ")),
                }));
              }, AXE_TAGS);
              for (const violation of violations) {
                const where = violation.targets.join("; ");
                local.push({
                  page: `${target.kit}/${target.component}`,
                  state: "accessibility",
                  rule: `axe:${violation.id}`,
                  message: `${violation.help} (${where})`,
                });
              }
            }
            for (const error of errors)
              local.push({
                page: `${target.kit}/${target.component}`,
                state: "load",
                rule: "page-error",
                message: error,
              });
          } catch (error) {
            local.push({
              page: `${target.kit}/${target.component}`,
              state: "load",
              rule: "page-error",
              message: error instanceof Error ? (error.message.split("\n")[0] ?? "") : String(error),
            });
          } finally {
            await context.close();
          }
          const dropped = local.some(
            (problem) => problem.rule === "page-error" && TRANSIENT.test(problem.message),
          );
          if (attempt === 0 && dropped) continue;
          problems.push(...local);
          break;
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
      const sharedKey = key.replace(/^html\//, "shared/");
      const twinKey = taken.has(sharedKey) ? sharedKey : key.replace(/^html\//, "react/");
      if (taken.has(twinKey) && !(await sameByKey(key, twinKey, taken))) {
        problems.push({
          page: key,
          state: "parity",
          rule: "kit-parity",
          message: "the HTML kit and the React kit draw this page differently (see checks/.images)",
        });
      }
      continue;
    }
    if (key.startsWith("shared/")) continue;
    if (!(key in reference)) added.push(key);
    else if (reference[key] !== hash) {
      // The stored reference picture decides when the hash differs only by drawing noise.
      const stored = `checks/.images/reference/${key}.png`;
      if (await sameByKey(key, key, new Map(), stored)) {
        next[key] = reference[key] ?? hash;
        continue;
      }
      changed.push(key);
    }
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
    if (options.noReference) {
      // Nothing to compare: the reference images belong to another machine.
    } else if (options.update) {
      const sorted = Object.fromEntries(Object.entries(next).sort(([a], [b]) => a.localeCompare(b)));
      // The accepted pictures are kept beside the hashes on this machine, for the noise comparison.
      for (const key of [...added, ...changed]) {
        const current = Bun.file(at(`checks/.images/${key}.png`));
        if (await current.exists())
          await writeFile(`checks/.images/reference/${key}.png`, await current.bytes());
      }
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
      for (const key of options.allowNew ? [] : added)
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
