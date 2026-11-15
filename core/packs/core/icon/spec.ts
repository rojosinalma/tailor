import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "icon",
  name: "Icon",
  pack: "core",
  group: "display",
  description: "One icon from the project's sprite. It takes the colour and the size of the text around it.",
  root: "t-icon",
  props: { set: ["bi", "simple-icons"] },
  html: "markup",
});
