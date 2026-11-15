import { defineComponent, TONES } from "@tailor/core/spec";

export default defineComponent({
  id: "card",
  name: "Card",
  pack: "core",
  group: "display",
  description:
    "A raised surface that groups content, with an optional header and footer. With an address, the whole card is a link. A card is a size container: put it in a stack or a grid, not in a row that sizes to content.",
  root: "t-card",
  parts: {
    "t-card-header": "the header: title, description and actions",
    "t-card-title": "the heading",
    "t-card-link": "the link in the title of a clickable card; its hit area covers the card",
    "t-card-description": "a line under the title",
    "t-card-actions": "buttons at the end of the header",
    "t-card-body": "the content",
    "t-card-footer": "the footer row",
  },
  props: { padding: ["default", "none"], tone: TONES },
  html: "markup",
});
