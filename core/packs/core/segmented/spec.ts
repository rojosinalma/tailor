import { defineComponent, SIZES } from "@tailor/core/spec";

export default defineComponent({
  id: "segmented",
  name: "Segmented control",
  pack: "core",
  group: "actions",
  description:
    "Picks one of two to five short options that stay visible, such as a view switch or a filter state. Arrow keys move the choice. For more or longer options, use a select.",
  root: "t-segmented",
  parts: {
    "t-segmented-option": "one choice; the chosen one looks raised",
    "t-segmented-input": "the native radio inside an option (HTML kit), visually hidden",
    "t-segmented-icon": "the icon of an option",
    "t-segmented-label": "the text of an option",
  },
  props: { size: SIZES },
  html: "markup",
});
