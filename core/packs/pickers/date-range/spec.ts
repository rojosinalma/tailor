import { defineComponent, SIZES } from "@tailor/core/spec";

export default defineComponent({
  id: "date-range",
  name: "Date range picker",
  pack: "pickers",
  group: "inputs",
  description:
    "Picks a start and an end day: the first click sets the start, the second the end. On a phone the calendar opens as a bottom sheet.",
  root: "t-date-range",
  parts: {
    "t-date-range-trigger": "the button that shows the range and opens the calendar",
    "t-date-range-value": "the range text, or the placeholder",
    "t-date-range-icon": "the calendar icon",
    "t-date-range-popup": "the surface of the calendar and the presets, also a t-popup",
    "t-date-range-presets": "the short list of preset ranges beside the calendar",
  },
  props: { size: SIZES },
  html: "script",
});
