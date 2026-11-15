import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "stepper",
  name: "Stepper",
  pack: "core",
  group: "navigation",
  description:
    'Shows the steps of a process and where the user is. Each step is done, current (aria-current="step") or upcoming. A horizontal stepper turns vertical in a narrow container.',
  root: "t-stepper",
  parts: {
    "t-stepper-list": "the <ol> of steps",
    "t-stepper-step": 'one step, with data-state="done|current|upcoming"',
    "t-stepper-marker": "the number of the step, or a check when it is done",
    "t-stepper-text": "the label and the description",
    "t-stepper-label": "the name of the step; a link on a done step that has an address",
    "t-stepper-description": "an optional line under the label",
  },
  props: { orientation: ["horizontal", "vertical"] },
  html: "markup",
});
