import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "form",
  name: "Form",
  pack: "forms",
  group: "inputs",
  description:
    'A validated form that never reloads the page: fields check on blur and on submit (then on each change until valid), a failed submit focuses the first invalid field, the outcome shows as a toast and server errors go on their fields. React: useTailorForm with Form, FormField, FormSection, FormSummary and FormActions. HTML: a form with data-t="form" checks with the native rules; data-t-submit="fetch" sends it with fetch and keeps its submit button busy (Tailor.busy) and fires t:send as it sends (detail.data, the FormData): a JSON answer {ok, message, errors} shows as a toast and puts the errors on their fields; any other answer (a picture, a file) comes in the t:submit event as detail.blob with detail.response, and a picture goes into the t-media-fit named by data-t-result="<id>" (alt text from data-t-result-alt, where {file} is the name of the chosen file; React props result and resultAlt), which a button with data-t-download="<id>" then saves. The buttons may sit outside the form, such as in a dialog footer: Form takes an id, FormActions there names it by itself, other buttons take form="<id>".',
  root: "t-form",
  parts: {
    "t-form-field": "one field of the form; data-span makes it full width in the grid layout",
    "t-form-section": "a group of fields with a title",
    "t-form-section-title": "the title of a section",
    "t-form-section-description": "the line under the title of a section",
    "t-form-section-body": "the fields of a section",
    "t-form-summary": "the list of errors at the top after a failed submit, a danger alert",
    "t-form-summary-list": "the links to the invalid fields",
    "t-form-actions":
      "the row of buttons at the end, or in a dialog footer; the submit button is the only primary one",
  },
  props: { layout: ["stack", "grid"] },
  html: "script",
});
