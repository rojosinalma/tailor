import { defineComponent, SIZES } from "@tailor/core/spec";

export default defineComponent({
  id: "multi-select",
  name: "Multi-select",
  pack: "core",
  group: "inputs",
  description:
    "Picks several values from a known set by typing to filter; the values show as chips in the box. On a phone the list opens as a bottom sheet.",
  root: "t-multi-select",
  parts: {
    "t-multi-select-chips": "the row of chips and the text input; it wraps, and the box grows with it",
    "t-chip": "one picked value, with its remove button",
    "t-multi-select-input": "the text input that filters the list",
    "t-multi-select-trigger": "the chevron that opens the list; also a t-input-action",
    "t-multi-select-popup": "the list surface, also a t-popup; it stays open while picking",
    "t-option": "one choice; a check marks the picked ones",
    "t-multi-select-description": "a line under the label of a choice",
    "t-multi-select-empty": "the line shown when no choice matches",
    "t-multi-select-status": "the line shown while the choices load",
  },
  props: { size: SIZES },
  html: "script",
});
