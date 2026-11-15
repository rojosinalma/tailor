import { defineComponent, SIZES } from "@tailor/core/spec";

export default defineComponent({
  id: "time",
  name: "Time picker",
  pack: "pickers",
  group: "inputs",
  description:
    "Picks a time of day from scrolling columns of hours and minutes. On a phone the columns open as a bottom sheet.",
  root: "t-time-picker",
  parts: {
    "t-time-trigger": "the button that shows the time and opens the columns",
    "t-time-value": "the time text, or the placeholder",
    "t-time-icon": "the clock icon",
    "t-time-popup": "the surface of the columns, also a t-popup",
    "t-time-columns": "the row of columns",
    "t-time-column": "one column (hours, minutes, seconds or AM/PM), a listbox of t-option rows",
  },
  props: { size: SIZES },
  html: "script",
});
