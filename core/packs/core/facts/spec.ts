import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "facts",
  name: "Facts",
  pack: "core",
  group: "display",
  description:
    "A list of keys and values. In rows the keys form one column and a value moves under its key when space runs out; in columns each fact is a small block in a grid, and a long value wraps or ends with an ellipsis inside its column. help puts a Help after a key (React prop help; HTML: the last word of the key and the t-help button in a t-facts-key-end span inside t-facts-key); on a touch screen a row with a help button is as tall as the touch area.",
  root: "t-facts",
  parts: {
    "t-facts-row": "one fact: a key and its value",
    "t-facts-key": "the key (dt)",
    "t-facts-key-end": "the last word of a key with its help button, kept on one line",
    "t-facts-value": "the value (dd); data-mono sets it in the mono font",
  },
  props: { layout: ["rows", "columns"] },
  html: "markup",
});
