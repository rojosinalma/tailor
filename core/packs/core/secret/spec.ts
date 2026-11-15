import { defineComponent, SIZES } from "@tailor/core/spec";

export default defineComponent({
  id: "secret",
  name: "Secret field",
  pack: "core",
  group: "inputs",
  description:
    "A secret value such as a password or a token, hidden until the reveal button shows it, with an optional copy button.",
  root: "t-secret",
  parts: {
    "t-secret-reveal": "the toggle that shows or hides the value, also a t-input-action",
    "t-secret-copy": "the button that copies the value, also a t-input-action",
  },
  props: { size: SIZES },
  html: "script",
});
