import { defineComponent, SIZES } from "@tailor/core/spec";

export default defineComponent({
  id: "theme-pickers",
  name: "Theme pickers",
  pack: "core",
  group: "actions",
  description:
    "The controls that change the skin, the palette and the mode of the page, for a footer or a settings page.",
  root: "t-theme-pickers",
  parts: {
    "t-theme-mode": "the icon button that switches between dark and light; its label says what a click does",
  },
  props: {
    parts: ["skin", "palette", "mode"],
    size: SIZES,
  },
  html: "script",
});
