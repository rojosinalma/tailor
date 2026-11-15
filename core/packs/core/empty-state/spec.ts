import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "empty-state",
  name: "Empty state",
  pack: "core",
  group: "display",
  description:
    "What a list, a table or a page shows when it has nothing: says what is empty and what to do next.",
  root: "t-empty",
  parts: {
    "t-empty-icon": "a large, quiet icon above the title",
    "t-empty-title": "says what is empty",
    "t-empty-text": "says what to do",
    "t-empty-actions": "the buttons that fill it",
  },
  props: { size: ["sm", "md"] },
  html: "markup",
});
