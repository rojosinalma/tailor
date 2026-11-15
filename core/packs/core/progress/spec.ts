import { defineComponent, TONES } from "@tailor/core/spec";

export default defineComponent({
  id: "progress",
  name: "Progress bar",
  pack: "core",
  group: "display",
  description:
    "Shows how far a task of known length has got, such as an upload. With no value it shows activity of unknown length. The fill width is the one custom property --t-progress on the root.",
  root: "t-progress",
  parts: {
    "t-progress-label": "the visible name, when it is shown",
    "t-progress-value": "the value as a percentage, when the label is shown",
    "t-progress-track": "the groove",
    "t-progress-fill": "the filled part, as wide as --t-progress",
  },
  props: { tone: TONES, size: ["sm", "md"] },
  html: "markup",
});
