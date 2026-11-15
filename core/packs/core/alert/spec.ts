import { defineComponent, TONES } from "@tailor/core/spec";

export default defineComponent({
  id: "alert",
  name: "Alert",
  pack: "core",
  group: "feedback",
  description:
    "A message inside the page flow, such as an error above a form. Danger and warning are announced at once. In the HTML kit the app handles the close button.",
  root: "t-alert",
  parts: {
    "t-alert-icon": "the glyph of the tone",
    "t-alert-content": "the title and the text",
    "t-alert-title": "the title, optional",
    "t-alert-text": "the message",
    "t-alert-actions": "buttons under the message, optional",
    "t-alert-close": "the close button, only when the alert can be closed",
  },
  props: { tone: TONES },
  html: "markup",
});
