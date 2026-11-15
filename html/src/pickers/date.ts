import { calendar, chevronLeft, chevronRight } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import {
  addMonths,
  focusDay,
  formatDate,
  formatLong,
  isOutOfBounds,
  monthGrid,
  monthLabel,
  moveByKey,
  parseIso,
  todayIso,
  type WeekStart,
  weekdayNames,
} from "@tailor/packs/pickers/date/logic";
import { createPopup } from "../popup";
import { glyph, h, register, uid } from "../runtime";

/** Draws a tailor date picker over a native <input type="date">, which stays in the form as the value holder. */
register("date", (element) => {
  if (!(element instanceof HTMLInputElement) || element.getAttribute("type") !== "date") return;
  const input = element;
  const placeholder = input.dataset.placeholder ?? "";
  const locale = input.dataset.locale || undefined;
  const weekStart: WeekStart = input.dataset.weekStart === "0" ? 0 : 1;
  const bounds = () => ({ min: input.min || null, max: input.max || null, weekStart, today: todayIso() });

  const value = h("span", { class: "t-date-value" });
  const trigger = h(
    "button",
    {
      type: "button",
      class: "t-control t-date-trigger",
      "aria-haspopup": "dialog",
      "aria-expanded": "false",
      "data-size": input.dataset.size,
      "aria-label": input.getAttribute("aria-label") ?? undefined,
      "aria-labelledby": input.getAttribute("aria-labelledby") ?? undefined,
      "aria-describedby": input.getAttribute("aria-describedby") ?? undefined,
      "aria-invalid": input.getAttribute("aria-invalid") ?? undefined,
      "aria-required": input.required ? "true" : undefined,
      disabled: input.disabled,
    },
    value,
    h("span", { class: "t-date-icon" }, glyph(calendar)),
  );
  const label = input.labels?.[0];
  if (label && !trigger.hasAttribute("aria-label") && !trigger.hasAttribute("aria-labelledby")) {
    label.id ||= uid("t-label");
    trigger.setAttribute("aria-labelledby", label.id);
    label.addEventListener("click", (event) => {
      event.preventDefault();
      trigger.focus();
    });
  }

  const title = h("div", { class: "t-calendar-title", "aria-live": "polite" });
  const previous = h(
    "button",
    { type: "button", class: "t-calendar-nav", "aria-label": t("previous") },
    glyph(chevronLeft),
  );
  const next = h(
    "button",
    { type: "button", class: "t-calendar-nav", "aria-label": t("next") },
    glyph(chevronRight),
  );
  const body = h("tbody");
  const head = h(
    "tr",
    {},
    ...weekdayNames(locale, weekStart).map((name) => h("th", { scope: "col", abbr: name.long }, name.short)),
  );
  const grid = h("table", { class: "t-calendar-grid", role: "grid" }, h("thead", {}, head), body);
  const today = h(
    "button",
    { type: "button", class: "t-btn", "data-variant": "ghost", "data-size": "sm" },
    t("today"),
  );
  const panel = h(
    "div",
    {
      class: "t-popup t-date-popup",
      role: "dialog",
      "aria-label": trigger.getAttribute("aria-label") ?? undefined,
      "aria-labelledby": trigger.getAttribute("aria-labelledby") ?? undefined,
    },
    h(
      "div",
      { class: "t-calendar" },
      h("div", { class: "t-calendar-header" }, previous, title, next),
      grid,
      h("div", { class: "t-calendar-footer" }, today),
    ),
  );
  const popup = createPopup(trigger, panel, {
    onClose: () => {
      trigger.setAttribute("aria-expanded", "false");
      trigger.removeAttribute("data-popup-open");
    },
  });

  const selected = (): string | null => (parseIso(input.value) ? input.value : null);
  let focus = todayIso();

  const paint = (): void => {
    const iso = selected();
    value.textContent = iso ? formatDate(iso, locale) : placeholder;
    value.toggleAttribute("data-placeholder", !iso);
  };

  const dayButton = (iso: string): HTMLButtonElement | null =>
    body.querySelector<HTMLButtonElement>(`[data-iso="${iso}"]`);

  const render = (): void => {
    const view = parseIso(focus);
    if (!view) return;
    const current = selected();
    const options = bounds();
    const text = monthLabel(view.year, view.month, locale);
    title.textContent = text;
    grid.setAttribute("aria-label", text);
    body.replaceChildren(
      ...monthGrid(view.year, view.month, options).map((week) =>
        h(
          "tr",
          {},
          ...week.map((day) =>
            h(
              "td",
              { role: "gridcell", "aria-selected": String(day.iso === current) },
              h(
                "button",
                {
                  type: "button",
                  class: "t-calendar-day",
                  "data-iso": day.iso,
                  tabindex: day.iso === focus ? "0" : "-1",
                  "aria-label": formatLong(day.iso, locale),
                  "data-selected": day.iso === current,
                  "data-today": day.today,
                  "data-outside": day.outside,
                  disabled: day.disabled,
                },
                String(day.day),
              ),
            ),
          ),
        ),
      ),
    );
    today.disabled = isOutOfBounds(options.today, options);
  };

  const show = (iso: string): void => {
    const view = parseIso(iso);
    if (!view) return;
    focus = focusDay(view.year, view.month, selected(), bounds());
    render();
  };

  const choose = (iso: string): void => {
    if (isOutOfBounds(iso, bounds())) return;
    if (input.value !== iso) {
      input.value = iso;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
    paint();
    popup.close();
    trigger.focus();
  };

  const open = (): void => {
    if (input.disabled || popup.isOpen()) return;
    show(selected() ?? todayIso());
    trigger.setAttribute("aria-expanded", "true");
    trigger.setAttribute("data-popup-open", "");
    popup.open();
    const day = dayButton(focus);
    if (day && !day.disabled) day.focus();
    else previous.focus();
  };

  trigger.addEventListener("click", () => (popup.isOpen() ? popup.close() : open()));
  previous.addEventListener("click", () => show(addMonths(focus, -1)));
  next.addEventListener("click", () => show(addMonths(focus, 1)));
  today.addEventListener("click", () => choose(todayIso()));
  body.addEventListener("click", (event) => {
    const day =
      event.target instanceof Element ? event.target.closest<HTMLButtonElement>(".t-calendar-day") : null;
    if (day?.dataset.iso && !day.disabled) choose(day.dataset.iso);
  });
  grid.addEventListener("keydown", (event) => {
    const to = moveByKey(focus, event.key, bounds());
    if (to === null) return;
    event.preventDefault();
    focus = to;
    render();
    dayButton(focus)?.focus();
  });
  // Focus that leaves for another control closes the popup, as a click outside does.
  panel.addEventListener("focusout", (event) => {
    const to = event.relatedTarget;
    if (to instanceof Node && !popup.positioner.contains(to) && to !== trigger) popup.close();
  });

  input.addEventListener("change", paint);
  input.setAttribute("data-t-upgraded", "");
  input.tabIndex = -1;
  input.setAttribute("aria-hidden", "true");
  input.after(trigger);
  paint();
});
