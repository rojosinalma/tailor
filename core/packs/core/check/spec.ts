import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "check",
  name: "Checkbox",
  pack: "core",
  group: "inputs",
  description:
    "A yes-or-no choice with its label, sent with the form. A check group labels several related checkboxes.",
  root: "t-check",
  parts: {
    "t-check-input": "the drawn box: a native checkbox in the HTML kit, the Base UI checkbox in React",
    "t-check-label": "the label text; the whole t-check is the hit area",
    "t-check-description": "an optional line under the label",
    "t-check-group": "a fieldset that holds related checkboxes",
    "t-check-group-label": "the legend of a check group",
  },
  html: "script",
});
