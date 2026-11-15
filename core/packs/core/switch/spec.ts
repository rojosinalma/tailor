import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "switch",
  name: "Switch",
  pack: "core",
  group: "inputs",
  description:
    "An on/off setting that applies at once. For a choice that a form sends later, use a checkbox.",
  root: "t-switch",
  parts: {
    "t-switch-input":
      "the track: a native checkbox with role switch in the HTML kit, the Base UI switch in React",
    "t-switch-thumb": "the thumb in the React kit; the HTML kit draws it as the track's ::before",
    "t-switch-label": "the label text; the whole t-switch is the hit area",
    "t-switch-description": "an optional line under the label",
  },
  html: "markup",
});
