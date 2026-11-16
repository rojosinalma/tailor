import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "composer",
  name: "Composer",
  pack: "chat",
  group: "inputs",
  description:
    "The input for a new message at the bottom of a conversation: a text area that grows with its content, files to attach, and one send button. Enter sends and Shift+Enter makes a new line; on a touch screen Enter makes a new line.",
  root: "t-composer",
  parts: {
    "t-composer-files": "the chosen files, as removable chips",
    "t-composer-input": "the text area",
    "t-composer-bar": "the row of buttons under the text",
    "t-composer-actions": "the extra buttons at the start",
    "t-composer-count": "the character count, near the limit",
    "t-composer-send": "the send button; the stop button while busy",
  },
  props: { label: [], placeholder: [], accept: [], maxLength: [], actions: [] },
  html: "none",
});
