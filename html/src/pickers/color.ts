import { t } from "@tailor/core/text";
import {
  areaText,
  fromArea,
  fromHue,
  type Hsv,
  hexToHsv,
  hsvToHex,
  moveArea,
  moveHue,
  parseHex,
} from "@tailor/packs/pickers/color/logic";
import { createPopup } from "../popup";
import { h, register } from "../runtime";
import { closeOnFocusOut, hideNative, pickerTrigger } from "./date";

const slider = (className: string, label: string, max: number): HTMLElement =>
  h("div", {
    class: className,
    role: "slider",
    tabindex: "0",
    "aria-label": label,
    "aria-valuemin": "0",
    "aria-valuemax": String(max),
  });

/**
 * Draws a tailor colour picker over a native <input type="color"> (or a text input with data-allow-none,
 * which can hold no colour), which stays in the form as the value holder.
 */
register("color", (element) => {
  if (!(element instanceof HTMLInputElement)) return;
  const input = element;
  const allowNone = input.dataset.allowNone !== undefined;
  const fallback = allowNone ? "" : "#000000";
  const current = (): string => parseHex(input.value) ?? fallback;
  const { trigger, labels, paint } = pickerTrigger(input, "t-color-picker", null, "", input);
  const swatch = h("span", { class: "t-color-picker-swatch" });
  trigger.prepend(swatch);

  const areaThumb = slider("t-color-area-thumb", t("colorArea"), 100);
  const hueThumb = slider("t-color-hue-thumb", t("colorHue"), 360);
  hueThumb.setAttribute("aria-orientation", "horizontal");
  const area = h("div", { class: "t-color-area" }, areaThumb);
  const hue = h("div", { class: "t-color-hue" }, hueThumb);
  const hex = h("input", {
    class: "t-control t-input t-color-hex",
    "data-size": "sm",
    "aria-label": t("colorHex"),
    spellcheck: "false",
    autocomplete: "off",
  });
  const none = allowNone
    ? h("button", { type: "button", class: "t-btn", "data-size": "sm" }, t("colorNone"))
    : null;
  const presets = (input.dataset.swatches ?? "")
    .split(/\s+/)
    .map(parseHex)
    .filter((s): s is string => s !== null);
  const swatches = presets.length
    ? h(
        "fieldset",
        { class: "t-color-swatches", "aria-label": t("colorSwatches") },
        ...presets.map((color) => {
          const button = h("button", {
            type: "button",
            class: "t-color-swatch",
            "aria-label": color,
            "data-color": color,
          });
          button.style.setProperty("--t-swatch", color);
          return button;
        }),
      )
    : null;
  const panel = h(
    "div",
    { class: "t-popup t-color-picker-popup", role: "dialog", ...labels },
    area,
    hue,
    h("div", { class: "t-color-picker-row" }, hex, none),
    swatches,
  );
  const popup = createPopup(trigger, panel, {
    align: "start",
    onClose: () => {
      trigger.setAttribute("aria-expanded", "false");
      trigger.removeAttribute("data-popup-open");
    },
  });
  let hsv: Hsv = hexToHsv(current() || "#000000");

  const show = (): void => {
    const value = current();
    paint(value || t("colorNone"));
    swatch.toggleAttribute("data-none", !value);
    if (value) swatch.style.setProperty("--t-swatch", value);
    else swatch.style.removeProperty("--t-swatch");
  };

  const draw = (): void => {
    const text = areaText(hsv);
    panel.style.setProperty("--t-color-hue", String(hsv.h));
    panel.style.setProperty("--t-color-x", String(hsv.s));
    panel.style.setProperty("--t-color-y", String(1 - hsv.v));
    panel.style.setProperty("--t-swatch", hsvToHex(hsv));
    areaThumb.setAttribute("aria-valuenow", String(text.s));
    areaThumb.setAttribute(
      "aria-valuetext",
      `${t("colorSaturation")} ${text.s}%, ${t("colorBrightness")} ${text.v}%`,
    );
    hueThumb.setAttribute("aria-valuenow", String(Math.round(hsv.h)));
    hueThumb.setAttribute("aria-valuetext", `${Math.round(hsv.h)}°`);
    const value = current();
    for (const button of swatches?.querySelectorAll<HTMLElement>("button") ?? [])
      button.setAttribute("aria-pressed", String(button.dataset.color === value));
    none?.setAttribute("aria-pressed", String(value === ""));
  };

  const commit = (next: string, from?: Hsv): void => {
    if (from) hsv = from;
    else if (next) hsv = hexToHsv(next);
    if (document.activeElement !== hex) hex.value = next;
    if (current() !== next || input.value !== next) {
      input.value = next;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
    draw();
  };
  const pick = (next: Hsv): void => commit(hsvToHex(next), next);

  const close = (event?: Event): void => {
    // Enter would also click the trigger that takes the focus.
    event?.preventDefault();
    popup.close();
    trigger.focus();
  };

  const drag = (track: HTMLElement, thumb: HTMLElement, read: (x: number, y: number) => Hsv): void => {
    const at = (event: PointerEvent): void => {
      const box = track.getBoundingClientRect();
      pick(
        read(
          box.width ? (event.clientX - box.left) / box.width : 0,
          box.height ? (event.clientY - box.top) / box.height : 0,
        ),
      );
    };
    track.addEventListener("pointerdown", (event) => {
      track.setPointerCapture(event.pointerId);
      at(event);
      thumb.focus();
      event.preventDefault();
    });
    track.addEventListener("pointermove", (event) => {
      if (track.hasPointerCapture(event.pointerId)) at(event);
    });
  };
  drag(area, areaThumb, (x, y) => fromArea(hsv.h, x, y));
  drag(hue, hueThumb, (x) => fromHue(hsv, x));

  const keys = (thumb: HTMLElement, move: (hsv: Hsv, key: string, shift: boolean) => Hsv | null): void => {
    thumb.addEventListener("keydown", (event) => {
      if (event.key === "Enter") return close(event);
      const next = move(hsv, event.key, event.shiftKey);
      if (!next) return;
      event.preventDefault();
      pick(next);
    });
  };
  keys(areaThumb, moveArea);
  keys(hueThumb, moveHue);

  hex.addEventListener("input", () => {
    const next = parseHex(hex.value);
    hex.toggleAttribute("aria-invalid", hex.value !== "" && !next);
    if (next) commit(next);
  });
  hex.addEventListener("blur", () => {
    hex.value = current();
    hex.removeAttribute("aria-invalid");
  });
  hex.addEventListener("keydown", (event) => {
    if (event.key === "Enter") close(event);
  });
  none?.addEventListener("click", () => {
    commit("");
    close();
  });
  swatches?.addEventListener("click", (event) => {
    const color = event.target instanceof HTMLElement ? event.target.dataset.color : undefined;
    if (color) commit(color);
  });

  trigger.addEventListener("click", () => {
    if (popup.isOpen()) return popup.close();
    if (input.disabled) return;
    const value = current();
    if (value && hsvToHex(hsv) !== value) hsv = hexToHsv(value);
    hex.value = value;
    draw();
    trigger.setAttribute("aria-expanded", "true");
    trigger.setAttribute("data-popup-open", "");
    popup.open();
    areaThumb.focus();
  });
  closeOnFocusOut(panel, popup.positioner, trigger, popup.close);

  input.addEventListener("change", show);
  hideNative(input);
  input.after(trigger);
  show();
});
