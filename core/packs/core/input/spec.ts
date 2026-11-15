import { defineComponent, SIZES } from "@tailor/core/spec";

export default defineComponent({
  id: "input",
  name: "Text input",
  pack: "core",
  group: "inputs",
  description:
    "One line of text. With a glyph, icon or short text inside the box, it becomes an input group.",
  root: "t-input",
  parts: {
    "t-input-group": "the box when the input holds something before or after the text, also a t-control",
    "t-input-native": "the bare input inside a group",
    "t-input-addon": "the glyph, icon or short text before or after the text",
    "t-input-action": "a small icon button inside a group, such as clear, reveal or copy",
  },
  props: { type: ["text", "email", "url", "tel", "password"], size: SIZES },
  html: "markup",
});
