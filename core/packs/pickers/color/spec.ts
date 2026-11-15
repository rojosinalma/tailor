import { defineComponent, SIZES } from "@tailor/core/spec";

export default defineComponent({
  id: "color",
  name: "Colour picker",
  pack: "pickers",
  group: "inputs",
  description:
    "Picks a free colour as #rrggbb from a saturation/brightness area, a hue slider, a hex field and optional swatches. On a phone it opens as a bottom sheet.",
  root: "t-color-picker",
  parts: {
    "t-color-picker-trigger": "the button that shows the colour and opens the picker",
    "t-color-picker-swatch": "the colour square in the trigger; data-none for no colour",
    "t-color-picker-value": "the hex value, or None",
    "t-color-picker-popup": "the picker surface, also a t-popup",
    "t-color-area": "the saturation (across) and brightness (up) area",
    "t-color-area-thumb": "the thumb of the area, a slider",
    "t-color-hue": "the hue track",
    "t-color-hue-thumb": "the thumb of the hue track, a slider",
    "t-color-picker-row": "the row with the hex field and the None button",
    "t-color-hex": "the hex field",
    "t-color-swatches": "the preset swatches",
    "t-color-swatch": "one preset swatch",
  },
  props: { size: SIZES },
  html: "script",
});
