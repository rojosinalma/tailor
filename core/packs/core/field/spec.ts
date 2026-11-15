import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "field",
  name: "Field",
  pack: "core",
  group: "inputs",
  description:
    "Puts one control in a form with its label, an optional help text and an error text. The way to place any control in a form.",
  root: "t-field",
  parts: {
    "t-field-label": "the label; a click on it focuses the control",
    "t-field-required": "the marker after the label of a required field",
    "t-field-control": "the slot that holds the control, which stretches to the field's width",
    "t-field-help": "the help text under the control",
    "t-field-error": "the error text; present and empty while the field is valid",
  },
  props: { orientation: ["vertical", "horizontal"] },
  html: "markup",
});
