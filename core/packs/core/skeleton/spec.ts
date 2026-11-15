import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "skeleton",
  name: "Skeleton",
  pack: "core",
  group: "display",
  description:
    'A grey placeholder in the shape of content that is still loading. It is hidden from screen readers: give the region that loads aria-busy="true" until the content is there.',
  root: "t-skeleton",
  parts: { "t-skeleton-line": "one line of a text placeholder; the last one is shorter" },
  props: {
    shape: ["text", "box", "circle"],
    /** The number of lines of a text placeholder. */
    lines: [],
    /** The height of a box, the diameter of a circle. */
    size: ["sm", "md", "lg"],
  },
  html: "markup",
});
