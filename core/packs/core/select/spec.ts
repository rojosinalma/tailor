import { defineComponent, SIZES } from "@tailor/core/spec";

export default defineComponent({
  id: "select",
  name: "Select",
  pack: "core",
  group: "inputs",
  description:
    "Picks one value from a known set. The list is drawn by tailor; on a phone it opens as a bottom sheet.",
  root: "t-select",
  parts: {
    "t-select-trigger": "the button that shows the value and opens the list",
    "t-select-value": "the value text, or the placeholder",
    "t-select-icon": "the chevron",
    "t-select-popup": "the list surface, also a t-popup",
    "t-option": "one choice",
  },
  props: { size: SIZES },
  html: "script",
});
