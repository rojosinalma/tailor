import { calendar } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import { parseIso, todayIso } from "@tailor/packs/pickers/date/logic";
import {
  cleanRange,
  type DateRange,
  formatRange,
  pickDay,
  presetUsable,
  type RangePreset,
  shownRange,
} from "@tailor/packs/pickers/date-range/logic";
import { createPopup } from "../popup";
import { glyph, h, register } from "../runtime";
import { closeOnFocusOut, createCalendar, hideNative, pickerTrigger } from "./date";

const PHONE = "(max-width: 40rem)";

const readPresets = (text: string | undefined): RangePreset[] => {
  try {
    const list: unknown = JSON.parse(text ?? "[]");
    return Array.isArray(list)
      ? list.filter(
          (p): p is RangePreset =>
            typeof p?.label === "string" && typeof p?.start === "string" && typeof p?.end === "string",
        )
      : [];
  } catch {
    return [];
  }
};

/** Draws one trigger over the two native <input type="date"> of a range, which stay in the form as the value holders. */
register("date-range", (root) => {
  const [first, second] = root.querySelectorAll<HTMLInputElement>('input[type="date"]');
  if (!first || !second) return;
  const locale = root.dataset.locale || undefined;
  const bounds = () => ({ min: first.min || null, max: first.max || null });
  const value = (): DateRange => cleanRange({ start: first.value, end: second.value });
  const { trigger, labels, paint } = pickerTrigger(
    root,
    "t-date-range",
    glyph(calendar),
    root.dataset.placeholder ?? "",
    first,
  );
  let draft: string | null = null;
  let hover: string | null = null;

  const set = (input: HTMLInputElement, iso: string): void => {
    if (input.value === iso) return;
    input.value = iso;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };
  const commit = (range: DateRange): void => {
    set(first, range.start ?? "");
    set(second, range.end ?? "");
    show();
    popup.close();
    trigger.focus();
  };

  const view = createCalendar({
    locale,
    weekStart: root.dataset.weekStart === "0" ? 0 : 1,
    bounds,
    selected: () => draft ?? value().start,
    range: () => shownRange(value(), draft, hover),
    onPick: (iso) => {
      const next = pickDay(draft, iso);
      draft = next.draft;
      hover = null;
      if (next.done) commit(next.done);
      else view.render();
    },
    onDayFocus: (iso) => {
      if (!draft || hover === iso) return;
      hover = iso;
      view.render();
    },
  });

  const presets = readPresets(root.dataset.presets).filter((p) =>
    presetUsable(p, bounds().min, bounds().max),
  );
  const list = presets.length
    ? h(
        "fieldset",
        { class: "t-date-range-presets", "aria-label": t("rangePresets") },
        ...presets.map((preset) => {
          const button = h(
            "button",
            { type: "button", class: "t-btn", "data-variant": "ghost", "data-size": "sm" },
            preset.label,
          );
          button.addEventListener("click", () => commit(preset));
          return button;
        }),
      )
    : null;
  const panel = h(
    "div",
    { class: "t-popup t-date-range-popup", role: "dialog", ...labels },
    list,
    view.element,
  );
  const popup = createPopup(trigger, panel, {
    align: "start",
    onClose: () => {
      draft = null;
      hover = null;
      trigger.setAttribute("aria-expanded", "false");
      trigger.removeAttribute("data-popup-open");
    },
  });

  const show = (): void => {
    const range = value();
    paint(range.start && range.end ? formatRange(range, locale) : null);
  };

  trigger.addEventListener("click", () => {
    if (popup.isOpen()) return popup.close();
    if (first.disabled) return;
    trigger.setAttribute("aria-expanded", "true");
    trigger.setAttribute("data-popup-open", "");
    const start = value().start;
    view.show(start && parseIso(start) ? start : todayIso(), matchMedia(PHONE).matches ? 1 : 2);
    popup.open();
    view.focus();
  });
  closeOnFocusOut(panel, popup.positioner, trigger, popup.close);

  for (const input of [first, second]) {
    input.addEventListener("change", show);
    hideNative(input);
  }
  root.append(trigger);
  show();
});
