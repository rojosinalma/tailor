import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "bare",
  name: "Bare shell",
  pack: "shell-bare",
  group: "shells",
  description:
    'A frame with no navigation, for sign-in, error and offline pages and full-screen views. align="center" puts the content in the middle of the screen at a card\'s width; align="start" gives it the whole screen (use a Page with mode="fill"). The brand and a muted line of footer facts are optional.',
  root: "t-shell",
  parts: {
    "t-bare-column": "the content with the brand above it, in the middle of the screen (align center)",
  },
  props: {
    brand: [],
    footer: [],
    theme: ["skin", "palette", "mode"],
    align: ["start", "center"],
    contained: [],
  },
  html: "markup",
});
