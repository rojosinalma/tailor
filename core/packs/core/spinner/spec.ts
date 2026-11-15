import { defineComponent, SIZES } from "@tailor/core/spec";

export default defineComponent({
  id: "spinner",
  name: "Spinner",
  pack: "core",
  group: "display",
  description:
    "Shows activity with no known length. It takes the colour of the text around it; for a known length use a progress bar.",
  root: "t-spinner",
  props: { size: SIZES },
  html: "markup",
});
