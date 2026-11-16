import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "first-run-page",
  name: "First-run page",
  pack: "layouts",
  group: "layouts",
  description:
    "A page with nothing in it yet, to copy: a Page whose table is replaced by an EmptyState that says what is empty and what to do, with the primary action that opens the add dialog of the form-dialog layout, and a short how-it-works in three numbered cards.",
  root: "t-page",
  html: "markup",
});
