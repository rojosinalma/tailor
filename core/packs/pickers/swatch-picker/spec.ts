import { defineComponent, SIZES } from "@tailor/core/spec";

export default defineComponent({
  id: "swatch-picker",
  name: "Swatch picker",
  pack: "pickers",
  group: "inputs",
  description:
    "Picks one colour from a fixed set, drawn as swatches: a radio group. A token swatch follows the palette.",
  root: "t-swatches",
  parts: {
    "t-swatches-option": "one swatch, a radio; its colour comes from --t-swatch",
    "t-swatches-input": "the native radio (HTML kit)",
    "t-swatches-check": "the check on the picked swatch, readable on any colour",
  },
  props: {
    size: SIZES,
    token: [
      "accent",
      "success",
      "warning",
      "danger",
      "info",
      "muted",
      "hue-red",
      "hue-orange",
      "hue-yellow",
      "hue-green",
      "hue-cyan",
      "hue-blue",
      "hue-purple",
      "hue-pink",
    ],
  },
  html: "markup",
});
