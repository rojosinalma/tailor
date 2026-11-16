import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "key-value-editor",
  name: "Key-value editor",
  pack: "forms",
  group: "inputs",
  description:
    "Edits pairs (environment variables, labels) as rows of a key and a value, with remove and Add. A key used twice is marked; a paste of KEY=value lines into a key fills one row per line; values of secret keys are hidden. The HTML kit upgrades a textarea of KEY=value lines.",
  root: "t-kv-editor",
  parts: {
    "t-kv-editor-list": "the list of rows",
    "t-kv-editor-row": "one pair with its remove button",
    "t-kv-editor-key": "the key input of a row",
    "t-kv-editor-value": "the value input of a row, a secret field for a secret key",
    "t-kv-editor-error": "the error text of a row",
  },
  html: "script",
});
