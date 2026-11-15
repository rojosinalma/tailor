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
    "t-slider-control": "the area that takes the pointer, as high as a control",
    "t-slider-track": "the rail",
    "t-slider-fill": "the part of the rail up to the value",
    "t-slider-thumb": "the handle",
    "t-slider-native": "the native range input of the HTML kit, drawn to the same look",
  },
  html: "script",
});
