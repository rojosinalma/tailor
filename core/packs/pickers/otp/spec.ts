import { defineComponent, SIZES } from "@tailor/core/spec";

export default defineComponent({
  id: "otp",
  name: "One-time code",
  pack: "pickers",
  group: "inputs",
  description:
    "A one-time code of a few characters in one box each. Paste fills every box; the code autofills from a text message.",
  root: "t-otp",
  parts: {
    "t-otp-input": "one box for one character; data-filled when it holds one",
  },
  props: { size: SIZES },
  html: "script",
});
