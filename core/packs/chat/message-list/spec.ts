import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "message-list",
  name: "Message list",
  pack: "chat",
  group: "display",
  description:
    "The transcript of a conversation: messages grouped by author and day, text rendered as Markdown, a column that fills its parent and keeps to the end while new text arrives. ChatView sets it above the notices and the composer.",
  root: "t-messages",
  parts: {
    "t-messages-log": "the column that scrolls: role=log, polite",
    "t-messages-inner": "the messages, within the reading width",
    "t-messages-day": "a day separator",
    "t-messages-item":
      "one message, an article: data-role=self|other|system, data-state=sending|streaming|failed, data-group-start on the first of a group",
    "t-messages-avatar": "the author's avatar, on the first message of a group",
    "t-messages-author": "the author's name, on the first message of a group",
    "t-messages-row": "the bubble and the time beside it",
    "t-messages-bubble": "the text of the message",
    "t-messages-time": "the time; data-times=hover on the root shows it on hover and focus only",
    "t-messages-activity": "the mark of a message that is still arriving",
    "t-messages-files": "the files of a message",
    "t-messages-failed": "the note and the retry button of a message that failed",
    "t-messages-actions": "the message actions: shown on hover and focus, always on a touch screen",
    "t-messages-jump": "the new messages button, when the view is not at the end",
    "t-messages-chat":
      "ChatView: the message list, the notices and the composer in a column that fills its parent",
  },
  props: {
    label: [],
    role: ["self", "other", "system"],
    state: ["sending", "streaming", "failed"],
    times: ["hover", "always"],
    timeFormat: ["clock", "relative"],
  },
  html: "none",
});
