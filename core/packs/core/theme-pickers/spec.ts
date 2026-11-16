import { defineComponent, SIZES } from "@tailor/core/spec";

export default defineComponent({
  id: "theme-pickers",
  name: "Theme pickers",
  pack: "core",
  group: "actions",
  description:
    'The controls that change the skin, the palette and the mode of the page, for a footer or a settings page. layout="compact" takes one row for a narrow column: one button shows the skin and the palette and opens them as two selects in a popover; the mode button stays beside it.',
  root: "t-theme-pickers",
  parts: {
    "t-theme-mode": "the icon button that switches between dark and light; its label says what a click does",
    "t-theme-pickers-trigger":
      'compact: the button that shows the skin and the palette and opens the popover; its text truncates, its aria-label is "Theme: " and the same values',
  },
  props: {
    parts: ["skin", "palette", "mode"],
    size: SIZES,
    layout: ["inline", "compact"],
  },
  html: "script",
});
