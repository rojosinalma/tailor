import { calendar, chevronLeft, chevronRight } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import {
  addMonths,
  type Bounds,
  focusDay,
  formatDate,
  formatLong,
  isOutOfBounds,
  monthGrid,
  monthLabel,
  monthOf,
  moveByKey,
  parseIso,
  rangeMarks,
  todayIso,
  viewFor,
  type WeekStart,
  weekdayNames,
} from "@tailor/packs/pickers/date/logic";
import { createPopup } from "../popup";
import { glyph, h, register, uid } from "../runtime";

export interface PickerTrigger {
  readonly trigger: HTMLButtonElement;
  /** The label attributes for the popup: the label without the value. */
  readonly labels: Record<string, string | undefined>;
  /** Shows a value, or the placeholder for null, and keeps the accessible name "label: value". */
  paint(text: string | null): void;
}

/**
 * The trigger of a picker that shows its value: a t-control button with the value and an icon.
 * It takes the label of the source (aria-label, aria-labelledby or a <label>), and a click on that label focuses it.
 */
export function pickerTrigger(
  source: HTMLElement,
  /** The root class: the parts are <root>-trigger, <root>-value and <root>-icon. */
  root: string,
  icon: Node | null,
  placeholder: string,
  disabled: boolean,
): PickerTrigger {
  const value = h("span", { class: `${root}-value`, id: uid("t-value") });
  const trigger = h(
    "button",
    {
      type: "button",
      class: `t-control ${root}-trigger`,
      "aria-haspopup": "dialog",
      "aria-expanded": "false",
      "data-size": source.dataset.size,
      "aria-describedby": source.getAttribute("aria-describedby") ?? undefined,
      disabled,
    },
    value,
    icon ? h("span", { class: `${root}-icon` }, icon) : null,
  );
  const label = source.getAttribute("aria-label");
  let labelledBy = source.getAttribute("aria-labelledby");
  const element = source instanceof HTMLInputElement ? source.labels?.[0] : undefined;
  if (element && !label && !labelledBy) {
    element.id ||= uid("t-label");
    labelledBy = element.id;
    element.addEventListener("click", (event) => {
      event.preventDefault();
      trigger.focus();
    });
  }
  if (labelledBy) trigger.setAttribute("aria-labelledby", `${labelledBy} ${value.id}`);
  return {
    trigger,
    labels: { "aria-label": label ?? undefined, "aria-labelledby": labelledBy ?? undefined },
    paint(text) {
      value.textContent = text ?? placeholder;
      value.toggleAttribute("data-placeholder", text === null);
      if (label) trigger.setAttribute("aria-label", `${label}: ${value.textContent}`);
    },
  };
}

export interface CalendarOptions {
  readonly locale: string | undefined;
  readonly weekStart: WeekStart;
  readonly bounds: () => Bounds;
  /** The picked day, whose month opens first. */
  readonly selected: () => string | null;
  readonly range?: () => { start: string | null; end: string | null };
  readonly onPick: (iso: string) => void;
  /** The pointer or the keyboard rests on a day. */
  readonly onDayFocus?: (iso: string) => void;
}

export interface CalendarView {
  readonly element: HTMLElement;
  /** Shows the month of a day, with that many months side by side. */
  show(iso: string, months: 1 | 2): void;
  /** Moves the focus to the focus day. */
  focus(): void;
  render(): void;
}

/** The month calendar of the HTML kit, the same markup as the React Calendar. */
export function createCalendar(options: CalendarOptions): CalendarView {
  const { locale, weekStart } = options;
  const months = h("div", { class: "t-calendar-months" });
  const today = h(
    "button",
    { type: "button", class: "t-btn", "data-variant": "ghost", "data-size": "sm" },
    t("today"),
  );
  const element = h("div", { class: "t-calendar" }, months, h("div", { class: "t-calendar-footer" }, today));
  const names = weekdayNames(locale, weekStart);
  let count: 1 | 2 = 1;
  let focus = todayIso();
  let view = monthOf(focus);
  const bounds = () => ({ ...options.bounds(), weekStart, today: todayIso() });

  const nav = (by: -1 | 1, show: boolean): HTMLElement => {
    if (!show) return h("span", { class: "t-calendar-nav", "aria-hidden": "true" });
    const button = h(
      "button",
      { type: "button", class: "t-calendar-nav", "aria-label": t(by === -1 ? "previous" : "next") },
      glyph(by === -1 ? chevronLeft : chevronRight),
    );
    button.addEventListener("click", () => {
      view = monthOf(addMonths(view, by));
      const shown = parseIso(view);
      if (shown) focus = focusDay(shown.year, shown.month, options.selected(), bounds());
      render();
    });
    return button;
  };

  function render(): void {
    const current = options.selected();
    const range = options.range?.() ?? { start: null, end: null };
    const limits = bounds();
    const focused = months.contains(document.activeElement);
    months.replaceChildren(
      ...Array.from({ length: count }, (_, index) => {
        const month = parseIso(addMonths(view, index));
        if (!month) return "";
        const title = monthLabel(month.year, month.month, locale);
        const rows = monthGrid(month.year, month.month, limits).map((week) =>
          h(
            "tr",
            {},
            ...week.map((day) => {
              if (day.outside && count > 1) return h("td");
              const marks = rangeMarks(day.iso, range.start, range.end);
              const picked = day.iso === current || marks.start || marks.end;
              return h(
                "td",
                { role: "gridcell", "aria-selected": String(picked || marks.inside) },
                h(
                  "button",
                  {
                    type: "button",
                    class: "t-calendar-day",
                    "data-iso": day.iso,
                    tabindex: day.iso === focus ? "0" : "-1",
                    "aria-label": formatLong(day.iso, locale),
                    "data-selected": picked,
                    "data-range-start": marks.start,
                    "data-range-end": marks.end,
                    "data-in-range": marks.inside,
                    "data-today": day.today,
                    "data-outside": day.outside,
                    disabled: day.disabled,
                  },
                  String(day.day),
                ),
              );
            }),
          ),
        );
        return h(
          "div",
          { class: "t-calendar-month" },
          h(
            "div",
            { class: "t-calendar-header" },
            nav(-1, index === 0),
            h("div", { class: "t-calendar-title", "aria-live": "polite" }, title),
            nav(1, index === count - 1),
          ),
          h(
            "table",
            { class: "t-calendar-grid", role: "grid", "aria-label": title },
            h(
              "thead",
              {},
              h("tr", {}, ...names.map((name) => h("th", { scope: "col", abbr: name.long }, name.short))),
            ),
            h("tbody", {}, ...rows),
          ),
        );
      }),
    );
    today.disabled = isOutOfBounds(limits.today, limits);
    if (focused) dayButton(focus)?.focus();
  }

  const dayButton = (iso: string): HTMLButtonElement | null =>
    months.querySelector<HTMLButtonElement>(`[data-iso="${iso}"]`);
  const dayOf = (target: EventTarget | null): HTMLButtonElement | null =>
    target instanceof Element ? target.closest<HTMLButtonElement>(".t-calendar-day") : null;

  today.addEventListener("click", () => options.onPick(todayIso()));
  months.addEventListener("click", (event) => {
    const day = dayOf(event.target);
    if (day?.dataset.iso && !day.disabled) options.onPick(day.dataset.iso);
  });
  months.addEventListener("pointerover", (event) => {
    const day = dayOf(event.target);
    if (day?.dataset.iso && !day.disabled) options.onDayFocus?.(day.dataset.iso);
  });
  months.addEventListener("keydown", (event) => {
    if (!dayOf(event.target)) return;
    const to = moveByKey(focus, event.key, bounds());
    if (to === null) return;
    event.preventDefault();
    focus = to;
    view = viewFor(view, focus, count);
    render();
    dayButton(focus)?.focus();
    options.onDayFocus?.(focus);
  });

  return {
    element,
    render,
    show(iso, shown) {
      count = shown;
      const month = parseIso(iso);
      if (!month) return;
      focus = focusDay(month.year, month.month, options.selected(), bounds());
      view = monthOf(focus);
      render();
    },
    focus() {
      const day = dayButton(focus);
      if (day && !day.disabled) day.focus();
      else element.querySelector<HTMLElement>("button:not(:disabled)")?.focus();
    },
  };
}

/** Draws a tailor date picker over a native <input type="date">, which stays in the form as the value holder. */
register("date", (element) => {
  if (!(element instanceof HTMLInputElement) || element.getAttribute("type") !== "date") return;
  const input = element;
  const locale = input.dataset.locale || undefined;
  const selected = (): string | null => (parseIso(input.value) ? input.value : null);
  const { trigger, labels, paint } = pickerTrigger(
    input,
    "t-date",
    glyph(calendar),
    input.dataset.placeholder ?? "",
    input.disabled,
  );

  const view = createCalendar({
    locale,
    weekStart: input.dataset.weekStart === "0" ? 0 : 1,
    bounds: () => ({ min: input.min || null, max: input.max || null }),
    selected,
    onPick: (iso) => {
      if (isOutOfBounds(iso, { min: input.min || null, max: input.max || null })) return;
      if (input.value !== iso) {
        input.value = iso;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
      show();
      popup.close();
      trigger.focus();
    },
  });
  const panel = h("div", { class: "t-popup t-date-popup", role: "dialog", ...labels }, view.element);
  const popup = createPopup(trigger, panel, {
    onClose: () => {
      trigger.setAttribute("aria-expanded", "false");
      trigger.removeAttribute("data-popup-open");
    },
  });
  const show = (): void => {
    const iso = selected();
    paint(iso ? formatDate(iso, locale) : null);
  };

  trigger.addEventListener("click", () => {
    if (popup.isOpen()) return popup.close();
    if (input.disabled) return;
    trigger.setAttribute("aria-expanded", "true");
    trigger.setAttribute("data-popup-open", "");
    view.show(selected() ?? todayIso(), 1);
    popup.open();
    view.focus();
  });
  closeOnFocusOut(panel, popup.positioner, trigger, popup.close);

  input.addEventListener("change", show);
  hideNative(input);
  input.after(trigger);
  show();
});

/** Focus that leaves for another control closes the popup, as a click outside does. */
export function closeOnFocusOut(
  panel: HTMLElement,
  inside: HTMLElement,
  trigger: HTMLElement,
  close: () => void,
) {
  panel.addEventListener("focusout", (event) => {
    const to = event.relatedTarget;
    if (to instanceof Node && !inside.contains(to) && to !== trigger) close();
  });
}

/** The native control stays in the form as the value holder, out of sight and out of the tab order. */
export function hideNative(input: HTMLElement): void {
  input.setAttribute("data-t-upgraded", "");
  input.tabIndex = -1;
  input.setAttribute("aria-hidden", "true");
}
