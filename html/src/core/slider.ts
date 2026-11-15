import { register } from "../runtime";

/** Paints the fill of a native range input and keeps the shown value in step with it. */
register("slider", (root) => {
  const input = root.querySelector<HTMLInputElement>("input.t-slider-native");
  if (!input) return;
  const output = root.querySelector<HTMLOutputElement>("output.t-slider-value");
  const paint = (): void => {
    const min = Number(input.min || 0);
    const max = Number(input.max || 100);
    const fraction = max > min ? (Number(input.value) - min) / (max - min) : 0;
    root.style.setProperty("--t-slider-value", String(fraction));
    if (output) output.value = input.value;
  };
  input.addEventListener("input", paint);
  paint();
});
