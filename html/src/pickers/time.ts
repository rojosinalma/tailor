import { clock } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import {
  type ColumnKey,
  formatTime,
  matchTyped,
  moveOption,
  parseTime,
  printTime,
  setPart,
  startTime,
  type Time,
  type TimeSettings,
  timeColumns,
  uses12Hour,
} from "@tailor/packs/pickers/time/logic";
import { createPopup } from "../popup";
import { glyph, h, register, uid } from "../runtime";
import { closeOnFocusOut, hideNative, pickerTrigger } from "./date";

const LABELS: Record<ColumnKey, Parameters<typeof t>[0]> = {
  hour: "timeHours",
  minute: "timeMinutes",
  second: "timeSeconds",
  period: "timePeriod",
};

/** Draws a tailor time picker over a native <input type="time">, which stays in the form as the value holder. */
register("time", (element) => {
  if (!(element instanceof HTMLInputElement) || element.getAttribute("type") !== "time") return;
  const input = element;
  const data = input.dataset;
  const locale = data.locale || undefined;
  const withSeconds = data.seconds !== undefined;
  const settings = (): TimeSettings => ({
    step: Number(data.step) || 5,
    seconds: withSeconds,
    hour12: uses12Hour(locale, data.hour12 === undefined ? undefined : data.hour12 === "true"),
    min: input.min || null,
    max: input.max || null,
    locale,
  });
  const { trigger, labels, paint } = pickerTrigger(
    input,
    "t-time",
    glyph(clock),
    data.placeholder ?? "",
    input,
  );
  const prefix = uid("t-time");
  const columns = h("div", { class: "t-time-columns" });
  const panel = h("div", { class: "t-popup t-time-popup", role: "dialog", ...labels }, columns);
  const popup = createPopup(trigger, panel, {
    align: "start",
    onClose: () => {
      trigger.setAttribute("aria-expanded", "false");
      trigger.removeAttribute("data-popup-open");
    },
  });
  let draft: Time = startTime(settings());
  let typed = { text: "", at: 0 };

  const show = (): void => {
    const time = parseTime(input.value);
    paint(time ? formatTime(time, settings().hour12, withSeconds, locale) : null);
  };

  const render = (): void => {
    const focused = [...columns.children].indexOf(document.activeElement ?? columns);
    const lists = timeColumns(draft, settings()).map((column) => {
      const selected = column.options.findIndex((o) => o.selected);
      const list = h(
        "div",
        {
          class: "t-time-column",
          role: "listbox",
          tabindex: "0",
          "data-column": column.key,
          "aria-label": t(LABELS[column.key]),
          "aria-activedescendant": selected >= 0 ? `${prefix}-${column.key}-${selected}` : undefined,
        },
        ...column.options.map((option, i) =>
          h(
            "div",
            {
              class: "t-option",
              role: "option",
              id: `${prefix}-${column.key}-${i}`,
              "data-index": String(i),
              "aria-selected": String(option.selected),
              "aria-disabled": option.disabled ? "true" : undefined,
              "data-highlighted": option.selected,
            },
            h("span", { class: "t-option-label" }, option.text),
          ),
        ),
      );
      return list;
    });
    columns.replaceChildren(...lists);
    center();
    lists[focused]?.focus();
  };

  const center = (): void => {
    for (const list of columns.children) {
      const row = list.querySelector<HTMLElement>("[aria-selected='true']");
      if (row) list.scrollTop = row.offsetTop - (list.clientHeight - row.offsetHeight) / 2;
    }
  };

  const pick = (next: Time): void => {
    draft = next;
    const text = printTime(next, withSeconds);
    if (input.value !== text) {
      input.value = text;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
    render();
  };

  const column = (target: EventTarget | null) => {
    const list = target instanceof Element ? target.closest<HTMLElement>(".t-time-column") : null;
    const key = list?.dataset.column as ColumnKey | undefined;
    const options = timeColumns(draft, settings()).find((c) => c.key === key)?.options;
    return list && key && options ? { list, key, options } : null;
  };

  columns.addEventListener("click", (event) => {
    const hit = column(event.target);
    const row = event.target instanceof Element ? event.target.closest<HTMLElement>(".t-option") : null;
    const option = hit?.options[Number(row?.dataset.index)];
    if (hit && option && !option.disabled) pick(setPart(draft, hit.key, option.value, settings()));
  });
  columns.addEventListener("keydown", (event) => {
    const hit = column(event.target);
    if (!hit) return;
    const { key } = event;
    let to = moveOption(
      hit.options,
      hit.options.findIndex((o) => o.selected),
      key,
    );
    if (key === "ArrowLeft") (hit.list.previousElementSibling as HTMLElement | null)?.focus();
    else if (key === "ArrowRight") (hit.list.nextElementSibling as HTMLElement | null)?.focus();
    else if (key === "Enter") {
      pick(draft);
      popup.close();
      trigger.focus();
    } else if (to === null && key.length === 1 && !event.ctrlKey && !event.metaKey) {
      const now = Date.now();
      typed = { text: now - typed.at > 1000 ? key : typed.text + key, at: now };
      to = matchTyped(hit.options, typed.text);
      if (to < 0) to = matchTyped(hit.options, key);
      if (to < 0) return;
    } else if (to === null) return;
    event.preventDefault();
    const option = to === null ? undefined : hit.options[to];
    if (option) pick(setPart(draft, hit.key, option.value, settings()));
  });

  trigger.addEventListener("click", () => {
    if (popup.isOpen()) return popup.close();
    if (input.disabled) return;
    draft = parseTime(input.value) ?? startTime(settings());
    trigger.setAttribute("aria-expanded", "true");
    trigger.setAttribute("data-popup-open", "");
    render();
    popup.open();
    center();
    (columns.firstElementChild as HTMLElement | null)?.focus();
  });
  closeOnFocusOut(panel, popup.positioner, trigger, popup.close);

  input.addEventListener("change", show);
  hideNative(input);
  input.after(trigger);
  show();
});
