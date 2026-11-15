import { dash, plus } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import { glyph, h, register } from "../runtime";

const REPEAT_DELAY = 400;
const REPEAT_EVERY = 60;

/** Draws the step buttons around a native <input type="number">, which stays the real field. */
register("number", (element) => {
  if (!(element instanceof HTMLInputElement) || element.type !== "number") return;
  const input = element;

  const clamp = (): void => {
    if (input.value === "") return;
    const value = input.valueAsNumber;
    const min = input.min === "" ? -Infinity : Number(input.min);
    const max = input.max === "" ? Infinity : Number(input.max);
    const next = Math.min(max, Math.max(min, value));
    if (next !== value) input.value = String(next);
  };
  const fire = (): void => {
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };
  const stepBy = (direction: 1 | -1): void => {
    if (input.disabled || input.readOnly) return;
    const before = input.value;
    if (direction > 0) input.stepUp();
    else input.stepDown();
    clamp();
    if (input.value !== before) fire();
  };

  const button = (direction: 1 | -1): HTMLButtonElement => {
    const step = h(
      "button",
      {
        type: "button",
        class: "t-number-step",
        tabindex: "-1",
        "aria-label": t(direction > 0 ? "increase" : "decrease"),
        disabled: input.disabled,
      },
      glyph(direction > 0 ? plus : dash),
    );
    let timer = 0;
    const stop = (): void => {
      clearTimeout(timer);
      clearInterval(timer);
    };
    step.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      input.focus();
      stepBy(direction);
      stop();
      timer = window.setTimeout(() => {
        timer = window.setInterval(() => stepBy(direction), REPEAT_EVERY);
      }, REPEAT_DELAY);
    });
    for (const name of ["pointerup", "pointerleave", "pointercancel"]) step.addEventListener(name, stop);
    // A keyboard or assistive click has no pointerdown before it.
    step.addEventListener("click", (event) => {
      if (event.detail === 0) stepBy(direction);
    });
    return step;
  };

  const decrement = button(-1);
  const increment = button(1);
  const box = h("div", {
    class: "t-control t-number",
    "data-size": input.dataset.size,
    "data-disabled": input.disabled,
  });
  input.after(box);
  input.classList.remove("t-control", "t-input");
  input.classList.add("t-number-input");
  input.removeAttribute("data-size");
  const unit = input.dataset.unit
    ? h("span", { class: "t-number-unit", "aria-hidden": "true" }, input.dataset.unit)
    : null;
  box.append(decrement, input, ...(unit ? [unit] : []), increment);

  // The arrow keys step natively; this keeps the value in range after typing.
  input.addEventListener("change", clamp);
  box.addEventListener("pointerdown", (event) => {
    if (event.target === box) {
      event.preventDefault();
      input.focus();
    }
  });
});
