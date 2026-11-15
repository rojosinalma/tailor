import { defineComponent, TONES } from "@tailor/core/spec";

export default defineComponent({
  id: "badge",
  name: "Badge",
  pack: "core",
  group: "display",
  description: "A short label for a state or a category. One line; long text ends in an ellipsis.",
  root: "t-badge",
  parts: { "t-badge-label": "the text" },
  props: { tone: TONES, variant: ["soft", "solid", "outline"] },
  html: "markup",
});
