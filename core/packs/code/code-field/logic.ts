/** The text edits and sizes of the code field. */

/** The indent that Tab inserts. */
export const INDENT = "  ";

export const lineCount = (text: string): number => text.split("\n").length;

/** The rows the field shows: as many as the text has lines, from `rows` up to `maxRows`. */
export const rowsFor = (text: string, rows: number, maxRows: number): number =>
  Math.min(Math.max(lineCount(text), rows), Math.max(rows, maxRows));

/** One replacement in the text: the range to replace, the new text, and the selection after it. */
export interface Edit {
  readonly from: number;
  readonly to: number;
  readonly text: string;
  readonly selectionStart: number;
  readonly selectionEnd: number;
}

/**
 * What Tab does: with no selection it inserts the indent at the caret; with a selection it indents
 * every line that the selection touches and keeps those lines selected.
 */
export function tabEdit(value: string, start: number, end: number): Edit {
  if (start === end) {
    const at = start + INDENT.length;
    return { from: start, to: end, text: INDENT, selectionStart: at, selectionEnd: at };
  }
  const from = value.lastIndexOf("\n", start - 1) + 1;
  const lines = value.slice(from, end).split("\n");
  const text = lines.map((line) => INDENT + line).join("\n");
  return {
    from,
    to: end,
    text,
    selectionStart: start + INDENT.length,
    selectionEnd: end + INDENT.length * lines.length,
  };
}
