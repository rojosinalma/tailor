import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "confirm",
  name: "Confirm",
  pack: "core",
  group: "feedback",
  description:
    'A question before a destructive or irreversible action; the text says the consequence. Focus starts on Cancel; Escape and the backdrop cancel. React: render <ConfirmRegion /> once, then await confirm({ title, text, confirmLabel, cancelLabel, danger }) from useConfirm(). HTML: await window.Tailor.confirm({ … }), or declaratively <button data-t="confirm-trigger" data-title="…" data-text="…" data-confirm-label="…" data-danger data-result-target="#out">, which writes "true" or "false" into the target and fires a bubbling "t-confirm" event with the answer in detail.',
  root: "t-dialog",
  parts: {
    "t-dialog-header": "the title row",
    "t-dialog-title": "the question",
    "t-dialog-body": "the consequence, one paragraph",
    "t-dialog-footer": "Cancel and the confirm button",
  },
  props: {},
  html: "script",
});
