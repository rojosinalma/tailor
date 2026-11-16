import { t } from "@tailor/core/text";
import {
  orderUnits,
  pickUnit,
  toAmount,
  toSeconds,
  UNIT_TEXT,
  unitBounds,
} from "@tailor/packs/forms/duration/logic";
import { h, register, uid, upgrade } from "../runtime";

/**
 * Upgrades <input type="number" data-t="duration">, whose value is seconds, to a number and a unit list.
 * The input stays in the form as the value holder.
 */
register("duration", (element) => {
  if (!(element instanceof HTMLInputElement) || element.type !== "number") return;
  const holder = element;
  const units = orderUnits(holder.dataset.units?.split(/\s+/));
  const limit = (attribute: string): number | undefined => (attribute === "" ? undefined : Number(attribute));
  const min = limit(holder.min);
  const max = limit(holder.max);
  const label = holder.getAttribute("aria-label") ?? "";
  const start = holder.value === "" ? null : holder.valueAsNumber;
  let unit = pickUnit(start, units);

  const id = holder.id || uid("t-duration");
  holder.removeAttribute("id");
  const amount = h("input", {
    type: "number",
    class: "t-control t-input",
    "data-t": "number",
    id,
    "aria-label": label,
    "aria-describedby": holder.getAttribute("aria-describedby") ?? undefined,
    "aria-invalid": holder.getAttribute("aria-invalid") ?? undefined,
    required: holder.required,
    disabled: holder.disabled,
  });
  const select = h(
    "select",
    {
      class: "t-control t-select",
      "data-t": "select",
      "aria-label": `${label} ${t("durationUnit")}`,
      disabled: holder.disabled,
    },
    ...units.map((u) => h("option", { value: u, selected: u === unit }, t(UNIT_TEXT[u]))),
  );
  const box = h("div", { class: "t-duration", "data-disabled": holder.disabled }, amount, select);

  const bound = (): void => {
    const range = unitBounds(unit, min, max);
    for (const [name, limit] of [
      ["min", range.min],
      ["max", range.max],
    ] as const) {
      if (limit === undefined) amount.removeAttribute(name);
      else amount.setAttribute(name, String(limit));
    }
  };
  const show = toAmount(start, unit);
  amount.value = show === null ? "" : String(show);
  bound();

  const sync = (): void => {
    const total = toSeconds(amount.value === "" ? null : amount.valueAsNumber, unit);
    const next = total === null ? "" : String(total);
    if (holder.value === next) return;
    holder.value = next;
    holder.dispatchEvent(new Event("input", { bubbles: true }));
    holder.dispatchEvent(new Event("change", { bubbles: true }));
  };
  holder.setAttribute("data-t-upgraded", "");
  holder.tabIndex = -1;
  holder.setAttribute("aria-hidden", "true");
  for (const name of ["aria-label", "aria-describedby"]) holder.removeAttribute(name);
  holder.after(box);
  // After the number upgrade, so that its range clamp runs first.
  upgrade(box);
  for (const type of ["input", "change"])
    amount.addEventListener(type, (event) => {
      event.stopPropagation();
      sync();
    });
  select.addEventListener("input", (event) => event.stopPropagation());
  select.addEventListener("change", (event) => {
    event.stopPropagation();
    const next = units.find((u) => u === select.value);
    if (!next) return;
    unit = next;
    bound();
    sync();
  });
});
