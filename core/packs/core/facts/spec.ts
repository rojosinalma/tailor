import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "facts",
  name: "Facts",
  pack: "core",
  group: "display",
  description:
    "A list of keys and values. In rows the keys form one column and a value moves under its key when space runs out; in columns each fact is a small block in a grid, and a long value wraps or ends with an ellipsis inside its column. help puts a Help after a key (React prop help; HTML: the t-help button inside t-facts-key, after the name); on a touch screen a row with a help button is as tall as the touch area.",
  root: "t-facts",
  parts: {
    "t-facts-row": "one fact: a key and its value",
    "t-facts-key": "the key (dt)",
    "t-facts-value": "the value (dd); data-mono sets it in the mono font",
  },
  props: { layout: ["rows", "columns"] },
  html: "markup",
});
