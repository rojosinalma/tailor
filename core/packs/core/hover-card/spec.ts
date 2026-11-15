import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "hover-card",
  name: "Hover card",
  pack: "core",
  group: "display",
  description:
    "A link that shows a preview of its target when the pointer rests on it or the keyboard focuses it. A touch screen gets no preview: a tap follows the link, so the preview never holds anything that the target lacks.",
  root: "t-hover-card",
  parts: {
    "t-hover-card-positioner": "places the card next to the link; never a bottom sheet",
    "t-hover-card-popup": "the card surface, also a t-popup",
  },
  html: "script",
});
