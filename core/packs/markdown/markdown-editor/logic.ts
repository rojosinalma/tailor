/** The text edits of the Markdown editor's toolbar. Each takes the text and selection and returns new ones. */

export interface TextState {
  readonly value: string;
  readonly start: number;
  readonly end: number;
}

/**
 * Wraps the selection in `before`/`after` (bold, italic, inline code). Without a selection it inserts the
 * placeholder and selects it. A selection that is already wrapped gets unwrapped.
 */
export function wrapSelection(
  state: TextState,
  before: string,
  after: string,
  placeholder: string,
): TextState {
  const { value, start, end } = state;
  if (
    start >= before.length &&
    value.slice(start - before.length, start) === before &&
    value.slice(end, end + after.length) === after
  ) {
    return {
      value:
        value.slice(0, start - before.length) + value.slice(start, end) + value.slice(end + after.length),
      start: start - before.length,
      end: end - before.length,
    };
  }
  const inner = start === end ? placeholder : value.slice(start, end);
  return {
    value: value.slice(0, start) + before + inner + after + value.slice(end),
    start: start + before.length,
    end: start + before.length + inner.length,
  };
}

/** Inline code for a selection on one line, a fenced block for one that spans lines. */
export function toggleCode(state: TextState, placeholder: string): TextState {
  const selected = state.value.slice(state.start, state.end);
  if (!selected.includes("\n")) return wrapSelection(state, "`", "`", placeholder);
  const lineStart = state.value.lastIndexOf("\n", state.start - 1) + 1;
  const open = lineStart === state.start ? "```\n" : "\n```\n";
  return wrapSelection(state, open, "\n```", placeholder);
}

export type LinePrefix = "- " | "> " | "## " | "ordered";

const PATTERNS: Record<LinePrefix, RegExp> = {
  "- ": /^- /,
  "> ": /^> /,
  "## ": /^## /,
  ordered: /^\d+\. /,
};

/**
 * Adds a prefix (list, quote, heading) to every line the selection touches, or removes it when every line
 * has it already. A caret moves with its text; a selection covers the changed lines.
 */
export function toggleLinePrefix(state: TextState, prefix: LinePrefix): TextState {
  const { value, start, end } = state;
  const from = value.lastIndexOf("\n", start - 1) + 1;
  const endsAt = value.indexOf("\n", end > start && value[end - 1] === "\n" ? end - 1 : end);
  const to = endsAt === -1 ? value.length : endsAt;
  const lines = value.slice(from, to).split("\n");
  const pattern = PATTERNS[prefix];
  const remove = lines.every((line) => pattern.test(line));
  const changed = lines.map((line, i) =>
    remove ? line.replace(pattern, "") : `${prefix === "ordered" ? `${i + 1}. ` : prefix}${line}`,
  );
  const block = changed.join("\n");
  const next = value.slice(0, from) + block + value.slice(to);
  if (start === end) {
    const delta = (changed[0]?.length ?? 0) - (lines[0]?.length ?? 0);
    const caret = Math.max(from, start + delta);
    return { value: next, start: caret, end: caret };
  }
  return { value: next, start: from, end: from + block.length };
}

/** Makes the selection a link and selects the address; without a selection, inserts a link and selects its text. */
export function insertLink(state: TextState, textPlaceholder: string, urlPlaceholder: string): TextState {
  const { value, start, end } = state;
  const text = start === end ? textPlaceholder : value.slice(start, end);
  const inserted = `[${text}](${urlPlaceholder})`;
  const next = value.slice(0, start) + inserted + value.slice(end);
  if (start === end) return { value: next, start: start + 1, end: start + 1 + text.length };
  const urlStart = start + text.length + 3;
  return { value: next, start: urlStart, end: urlStart + urlPlaceholder.length };
}
