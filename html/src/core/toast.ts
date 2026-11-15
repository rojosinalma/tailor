import { close, danger, info, success, warning } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import { glyph, h, register, uid } from "../runtime";

type Tone = "success" | "warning" | "danger" | "info";
export interface ToastOptions {
  readonly title?: string;
  readonly action?: { readonly label: string; readonly onClick: () => void };
  readonly duration?: number;
}

const GLYPHS: Record<Tone, string> = { success, warning, danger, info };
const LIMIT = 4;
const DURATION = 4000;

interface Entry {
  readonly element: HTMLElement;
  remaining: number;
  started: number;
  timer: number;
}

/** Newest first, as Base UI keeps them. */
const entries: Entry[] = [];
let region: HTMLElement | null = null;
let hovering = false;
let focused = false;
let away = false;

const paused = (): boolean => hovering || focused || away;

function start(entry: Entry): void {
  if (entry.remaining <= 0 || paused()) return;
  entry.started = Date.now();
  entry.timer = window.setTimeout(() => dismiss(entry), entry.remaining);
}

function pause(entry: Entry): void {
  if (!entry.timer) return;
  clearTimeout(entry.timer);
  entry.timer = 0;
  entry.remaining -= Date.now() - entry.started;
}

/** As in Base UI, the close buttons reach assistive tech while the toasts have the pointer or the focus. */
const sync = (): void => {
  for (const entry of entries) {
    entry.element.querySelector(".t-toast-close")?.setAttribute("aria-hidden", String(!paused()));
    if (paused()) pause(entry);
    else if (!entry.timer) start(entry);
  }
};

/** The toasts beyond the limit wait, hidden and inert, until a newer one leaves. */
const limit = (): void => {
  entries.forEach((entry, index) => {
    entry.element.toggleAttribute("data-limited", index >= LIMIT);
    entry.element.inert = index >= LIMIT;
  });
};

function dismiss(entry: Entry): void {
  const index = entries.indexOf(entry);
  if (index < 0) return;
  entries.splice(index, 1);
  clearTimeout(entry.timer);
  const { element } = entry;
  if (element.contains(document.activeElement)) region?.focus();
  element.setAttribute("data-ending-style", "");
  Promise.all(element.getAnimations().map((animation) => animation.finished)).then(
    () => element.remove(),
    () => element.remove(),
  );
  limit();
}

function getRegion(): HTMLElement {
  if (region?.isConnected) return region;
  const element = h("div", {
    class: "t-toasts",
    role: "region",
    "aria-live": "polite",
    "aria-label": t("notifications"),
    tabindex: "-1",
    popover: "manual",
  });
  element.addEventListener("pointerenter", () => {
    hovering = true;
    sync();
  });
  element.addEventListener("pointerleave", () => {
    hovering = false;
    sync();
  });
  element.addEventListener("focusin", () => {
    focused = true;
    sync();
  });
  element.addEventListener("focusout", (event) => {
    focused = event.relatedTarget instanceof Node && element.contains(event.relatedTarget);
    sync();
  });
  // Like Base UI, the toasts wait while the window is in the background.
  addEventListener("blur", () => {
    away = true;
    sync();
  });
  addEventListener("focus", () => {
    away = false;
    sync();
  });
  region = element;
  return element;
}

/**
 * The region lives in the top layer, above every dialog. A modal dialog makes the rest of the page inert,
 * so while one is open the region moves into it, and it comes back to the body when the dialog closes.
 */
function lift(element: HTMLElement): void {
  const host = [...document.querySelectorAll("dialog")].findLast((d) => d.matches(":modal")) ?? document.body;
  if (element.parentElement !== host) {
    hovering = false;
    focused = false;
    host.append(element);
    if (host instanceof HTMLDialogElement)
      host.addEventListener("close", () => lift(element), { once: true });
  }
  // Showing it again puts it on top of a dialog or popover that opened after it.
  if (element.matches(":popover-open")) element.hidePopover();
  element.showPopover();
}

/** Shows a short report of an outcome. It leaves by itself; a danger toast stays until it is closed. */
export function toast(tone: Tone, message: string, options: ToastOptions = {}): void {
  const target = getRegion();
  lift(target);
  const titleId = uid("t-toast-title");
  const textId = uid("t-toast-text");
  const closer = h(
    "button",
    { type: "button", class: "t-toast-close", "aria-label": t("close") },
    glyph(close),
  );
  const action = options.action
    ? h("button", { type: "button", class: "t-btn t-toast-action", "data-size": "sm" }, options.action.label)
    : null;
  const element = h(
    "div",
    {
      class: "t-toast",
      "data-tone": tone,
      "data-type": tone,
      role: "dialog",
      "aria-modal": "false",
      "aria-labelledby": options.title ? titleId : undefined,
      "aria-describedby": textId,
      "data-starting-style": true,
    },
    h("span", { class: "t-toast-icon" }, glyph(GLYPHS[tone])),
    h(
      "div",
      { class: "t-toast-content" },
      options.title ? h("h2", { class: "t-toast-title", id: titleId }, options.title) : null,
      h("p", { class: "t-toast-text", id: textId }, message),
    ),
    action,
    closer,
  );
  const entry: Entry = {
    element,
    remaining: tone === "danger" ? 0 : (options.duration ?? DURATION),
    started: 0,
    timer: 0,
  };
  closer.addEventListener("click", () => dismiss(entry));
  action?.addEventListener("click", () => {
    options.action?.onClick();
    dismiss(entry);
  });
  closer.setAttribute("aria-hidden", String(!paused()));
  entries.unshift(entry);
  target.prepend(element);
  limit();
  start(entry);
  requestAnimationFrame(() => requestAnimationFrame(() => element.removeAttribute("data-starting-style")));
}

window.Tailor = { ...(window.Tailor ?? {}), toast };

const TONES = new Set<string>(["success", "warning", "danger", "info"]);
const isTone = (value: string | undefined): value is Tone => value !== undefined && TONES.has(value);

/**
 * The declarative form: <button data-t="toast-trigger" data-tone="success" data-message="Saved">.
 * With data-action="Undo" the toast gets that button; a click fires a bubbling "t-toast-action" event here.
 */
register("toast-trigger", (element) => {
  element.addEventListener("click", () => {
    const { tone, message, title, duration, action } = element.dataset;
    if (!message) return;
    toast(isTone(tone) ? tone : "info", message, {
      title,
      duration: duration ? Number(duration) : undefined,
      action: action
        ? {
            label: action,
            onClick: () => element.dispatchEvent(new Event("t-toast-action", { bubbles: true })),
          }
        : undefined,
    });
  });
});
