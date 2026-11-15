import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "radio",
  name: "Radio group",
  pack: "core",
  group: "inputs",
  description:
    "One choice from a few options that are all visible, each with room for a description. For many options use a select.",
  root: "t-radio",
  parts: {
    "t-radio-group": "the fieldset that holds the options",
    "t-radio-group-label": "the legend of the group",
    "t-radio-input": "the drawn circle: a native radio in the HTML kit, the Base UI radio in React",
    "t-radio-label": "the label text of one option; the whole t-radio is the hit area",
    "t-radio-description": "an optional line under the label of one option",
  },
  props: { orientation: ["vertical", "horizontal"] },
  html: "markup",
});
