import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "truncate",
  name: "Truncate",
  pack: "core",
  group: "display",
  description:
    "Text cut to one line, or to two or three, with an ellipsis. The full text stays for screen readers.",
  root: "t-truncate",
  props: { lines: ["1", "2", "3"] },
  html: "markup",
});
