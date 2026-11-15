import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "button-group",
  name: "Button group",
  pack: "core",
  group: "actions",
  description:
    "Joins related buttons into one control with shared borders. It never wraps: in a narrow space the buttons shrink and their text truncates.",
  root: "t-btn-group",
  props: { label: [] },
  html: "markup",
});
