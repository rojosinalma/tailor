import { defineComponent, SIZES } from "@tailor/core/spec";

export default defineComponent({
  id: "button",
  name: "Button",
  pack: "core",
  group: "actions",
  description: "Starts an action. A view has at most one primary button.",
  root: "t-btn",
  parts: { "t-btn-label": "the text, when the button also holds an icon" },
  props: {
    variant: ["default", "primary", "danger", "ghost", "link"],
    size: SIZES,
  },
  html: "markup",
});
