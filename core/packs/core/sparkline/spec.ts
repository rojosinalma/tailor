import { defineComponent, TONES } from "@tailor/core/spec";

export default defineComponent({
  id: "sparkline",
  name: "Sparkline",
  pack: "core",
  group: "display",
  description:
    "A small line of values over time, optionally with the area under it, as wide as its container. One image with an accessible name; say the latest value in text next to it.",
  root: "t-sparkline",
  parts: {
    "t-sparkline-line": "the line through the values",
    "t-sparkline-area": "the area under the line",
  },
  props: { tone: TONES, size: ["sm", "md"] },
  html: "markup",
});
