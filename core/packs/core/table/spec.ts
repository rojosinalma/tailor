import { defineComponent, TONES } from "@tailor/core/spec";

export default defineComponent({
  id: "table",
  name: "Table",
  pack: "core",
  group: "display",
  description:
    "A plain table for a small, fixed set of rows. In a narrow box each row becomes a card, or the table scrolls sideways.",
  root: "t-table",
  parts: {
    "t-table-wrap": "the box around the table: the size container, with the border and the corners",
  },
  props: {
    density: ["default", "compact"],
    narrow: ["cards", "scroll"],
    /** On a th and its td cells. "num" is end-aligned; "actions" and "icon" take only the width they need. */
    kind: ["text", "num", "actions", "icon"],
    /** On a th and its td cells. Low-priority columns hide first when the box gets narrow. */
    priority: ["default", "low"],
    /** On a th: a fixed column width. */
    width: ["2xs", "xs", "sm"],
    /** On a tr: a thin toned edge at the start of the row. */
    tone: TONES,
  },
  html: "markup",
});
