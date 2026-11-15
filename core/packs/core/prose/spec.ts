import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "prose",
  name: "Prose",
  pack: "core",
  group: "display",
  description:
    "Styles long text that comes as plain HTML, such as rendered Markdown: headings, lists, quotes, code, tables and images.",
  root: "t-prose",
  html: "markup",
});
