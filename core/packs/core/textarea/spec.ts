import { defineComponent, SIZES } from "@tailor/core/spec";

export default defineComponent({
  id: "textarea",
  name: "Text area",
  pack: "core",
  group: "inputs",
  description:
    "Several lines of text. It resizes vertically; with auto-grow it follows its content up to a maximum height.",
  root: "t-textarea",
  props: { size: SIZES },
  html: "markup",
});
