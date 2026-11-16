import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "slider",
  name: "Slider",
  pack: "core",
  group: "inputs",
  description:
    "A value in a range, set by dragging or with the arrow keys. For an exact number use a number field.",
  root: "t-slider",
  parts: {
    "t-slider-header": "the row with the label and the shown value",
    "t-slider-label": "the visible label",
    "t-slider-value": "the shown value, when showValue is set",
    "t-slider-native": "the native range input, drawn: its rail shows the fill up to the value",
  },
  html: "script",
});
