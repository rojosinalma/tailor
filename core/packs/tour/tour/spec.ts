import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "tour",
  name: "Tour",
  pack: "tour",
  group: "feedback",
  description:
    "A guided tour: a sequence of steps, each pointing at one element of the UI with a short explanation. The page dims around the element and stays inert; Back, Next and Skip move, and so do the arrow keys and Escape. On a phone the text is a bottom sheet.",
  /* The root is the step popup next to the target, also a t-popup; a bottom sheet on a phone. */
  root: "t-tour",
  parts: {
    "t-tour-layer": "the full-screen layer that keeps the page from pointer use",
    "t-tour-cutout": "the box around the target; its shadow dims the rest of the page",
    "t-tour-count": "the step count, such as Step 2 of 5",
    "t-tour-title": "the title of the step",
    "t-tour-text": "the explanation",
    "t-tour-actions": "the row of Skip, Back and Next or Done",
  },
  props: {
    side: ["top", "bottom", "left", "right"],
    align: ["start", "center", "end"],
    steps: [],
    label: [],
  },
  html: "none",
});
