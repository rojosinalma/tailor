import { defineComponent, SIZES } from "@tailor/core/spec";

export default defineComponent({
  id: "number",
  name: "Number field",
  pack: "core",
  group: "inputs",
  description:
    "A number with drawn step buttons. The buttons repeat while held; the arrow keys step; the value stays between min and max.",
  root: "t-number",
  parts: {
    "t-number-input": "the text of the number",
    "t-number-step": "the decrease or increase button",
    "t-number-unit": "an optional short suffix such as ms",
  },
  props: { size: SIZES },
  html: "script",
});
