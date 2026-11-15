import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "help",
  name: "Help",
  pack: "core",
  group: "feedback",
  description:
    "A small round info button on the text line that opens a popover with an explanation of the field or value next to it.",
  root: "t-help",
  parts: {},
  props: { tone: ["accent", "info", "danger"] },
  html: "script",
});
