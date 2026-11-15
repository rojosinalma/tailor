import { defineComponent, SIZES } from "@tailor/core/spec";

export default defineComponent({
  id: "combobox",
  name: "Combobox",
  pack: "core",
  group: "inputs",
  description:
    "Picks one value from a known set by typing to filter it. With allowCustom it also keeps a typed value. On a phone the list opens as a bottom sheet.",
  root: "t-combobox",
  parts: {
    "t-combobox-clear": "the clear button, shown while there is a value; also a t-input-action",
    "t-combobox-trigger": "the chevron that opens the list; also a t-input-action",
    "t-combobox-popup": "the list surface, also a t-popup",
    "t-option": "one choice",
    "t-combobox-description": "a line under the label of a choice",
    "t-combobox-empty": "the line shown when no choice matches",
    "t-combobox-status": "the line shown while the choices load",
  },
  props: { size: SIZES },
  html: "script",
});
