import { defineComponent, TONES } from "@tailor/core/spec";

export default defineComponent({
  id: "mini-bars",
  name: "Mini bar chart",
  pack: "core",
  group: "display",
  description:
    "A small bar chart from a few values, such as the load per core, as wide as its container. One image with an accessible name. Each bar's height is the custom property --t-value.",
  root: "t-minibars",
  parts: { "t-minibars-bar": "one bar, as high as --t-value" },
  props: { tone: TONES, size: ["sm", "md"] },
  html: "markup",
});
