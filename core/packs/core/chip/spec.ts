import { defineComponent, TONES } from "@tailor/core/spec";

export default defineComponent({
  id: "chip",
  name: "Chip",
  pack: "core",
  group: "display",
  description:
    "A value the user added or can toggle: a tag or a filter. It can carry a remove button, or be a toggle button itself.",
  root: "t-chip",
  parts: {
    "t-chip-label": "the text",
    "t-chip-check": "the check mark of a toggle chip; it shows while aria-pressed is true",
    "t-chip-remove": "the button that removes the chip; its name is “Remove <label>”",
  },
  props: { tone: TONES },
  html: "markup",
});
