import { defineComponent, SIZES } from "@tailor/core/spec";

export default defineComponent({
  id: "dialog",
  name: "Dialog",
  pack: "core",
  group: "feedback",
  description:
    "A window over the page for one task, such as an edit form. On a phone it takes the full screen.",
  root: "t-dialog",
  parts: {
    "t-dialog-backdrop": "the dimmed layer behind the dialog",
    "t-dialog-header": "title row with the close button",
    "t-dialog-title": "the title",
    "t-dialog-close": "the close button",
    "t-dialog-body": "the content, which scrolls when it is long",
    "t-dialog-footer": "the actions, at the end",
  },
  props: { size: SIZES },
  html: "script",
});
