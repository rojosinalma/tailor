import { defineComponent, SIZES } from "@tailor/core/spec";

export default defineComponent({
  id: "button",
  name: "Button",
  pack: "core",
  group: "actions",
  description:
    "Starts an action. A view has at most one primary button. ButtonLink has the same look for an action that goes to another page; `loading` shows a spinner and ignores clicks.",
  root: "t-btn",
  parts: {
    "t-btn-label": "the text, when the button also holds an icon",
    "t-btn-spinner": "the spinner of a loading button, in place of the icon",
  },
  props: {
    variant: ["default", "primary", "danger", "ghost", "link"],
    size: SIZES,
  },
  html: "markup",
});
