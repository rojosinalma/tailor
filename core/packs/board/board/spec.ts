import { defineComponent, TONES } from "@tailor/core/spec";

export default defineComponent({
  id: "board",
  name: "Board",
  pack: "board",
  group: "display",
  description:
    "A kanban board: columns of cards, each column with a title, a count and an optional limit. A card moves by dragging its grip (pointer, touch or keyboard) or through its “Move to…” menu. The board is controlled: it reports a move and the app applies it (applyBoardMove does that for a list of cards). It fills its parent; the columns scroll by themselves, the board scrolls sideways. In a narrow box one column shows at a time, picked with tabs above.",
  root: "t-board",
  parts: {
    "t-board-switch": "the tabs that pick the column in a narrow box, with counts",
    "t-board-columns": "the row of columns; it scrolls sideways when the columns do not fit",
    "t-board-column": "one column; data-selected marks the one a narrow box shows",
    "t-board-column-header": "the title and the count of a column",
    "t-board-column-title": "the heading of a column",
    "t-board-count": "the count, with the limit; over the limit it turns to the warning tone and says so",
    "t-board-column-body": "the cards of a column; it scrolls by itself",
    "t-board-column-footer": "the row after the last card, with the Add button; it scrolls with the cards",
    "t-board-card": "one card, also a t-card; its title has the full width",
    "t-board-card-row": "the last row of a card: the badges at the start, the actions at the end",
    "t-board-card-actions": "the avatar, the “Move to…” menu and the grip, at the end of the last row",
    "t-board-move": "the button that opens the “Move to…” menu of a card",
  },
  props: { tone: TONES },
  html: "none",
});
