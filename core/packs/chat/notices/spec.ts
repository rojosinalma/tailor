import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "notices",
  name: "Notices",
  pack: "chat",
  group: "feedback",
  description:
    "The things in a conversation that wait for an answer, above the composer: questions, approvals and warnings, each with its buttons. More than three collapse; a tall stack scrolls by itself.",
  root: "t-notices",
  parts: {
    "t-notices-list": "the cards",
    "t-notices-item": "one card, with data-tone",
    "t-notices-icon": "the icon of the tone",
    "t-notices-content": "the title and the text",
    "t-notices-title": "the title",
    "t-notices-text": "the text",
    "t-notices-actions": "the buttons",
    "t-notices-more": "the button that shows or hides the collapsed cards",
  },
  props: { label: [], tone: ["neutral", "accent", "success", "warning", "danger", "info"] },
  html: "none",
});
