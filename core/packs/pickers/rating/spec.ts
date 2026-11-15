import { defineComponent, SIZES } from "@tailor/core/spec";

export default defineComponent({
  id: "rating",
  name: "Rating",
  pack: "pickers",
  group: "inputs",
  description:
    "A rating from 1 to a maximum, drawn as stars: a radio group, or an image of the stars when read-only.",
  root: "t-rating",
  parts: {
    "t-rating-star": "one star, a radio; filled up to the picked one",
    "t-rating-input": "the native radio (HTML kit)",
    "t-rating-glyph": "the empty and the filled star, stacked",
  },
  props: { size: SIZES },
  html: "markup",
});
