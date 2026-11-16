import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "form-dialog",
  name: "Form dialog",
  pack: "layouts",
  group: "layouts",
  description:
    "The way to add or edit a record without leaving the page, to copy: a button opens a Dialog that holds a Form of the forms pack with fields of different kinds, help texts, a required field and a checked one, the error summary, Cancel and a primary submit that shows it works; a sent form shows a success toast and the dialog closes. On a phone the dialog takes the screen. HTML kit: the form posts to its action with fetch; the script closes the dialog when the answer is ok.",
  root: "t-dialog",
  html: "script",
});
