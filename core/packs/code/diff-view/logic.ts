/** The rows model of the diff view: hunks of numbered lines, from two texts or from a unified diff. */
import { parsePatch, type StructuredPatch, structuredPatch } from "diff";

export type Change = "add" | "remove" | "context";

export interface DiffLine {
  readonly change: Change;
  readonly text: string;
  /** The line number before the change; none for an added line. */
  readonly old?: number;
  /** The line number after the change; none for a removed line. */
  readonly new?: number;
}

export interface DiffHunk {
  /** The hunk header, such as "@@ -1,4 +1,5 @@". */
  readonly header: string;
  /** The file, when the diff holds more than one. */
  readonly file?: string;
  readonly lines: readonly DiffLine[];
}

export interface DiffModel {
  readonly hunks: readonly DiffHunk[];
  readonly added: number;
  readonly removed: number;
}

const CHANGES: Record<string, Change> = { "+": "add", "-": "remove", " ": "context" };

function fromStructured(patches: readonly StructuredPatch[]): DiffModel {
  let added = 0;
  let removed = 0;
  const hunks: DiffHunk[] = [];
  const named = patches.length > 1;
  for (const patch of patches) {
    const file = named ? (patch.newFileName ?? patch.oldFileName)?.replace(/^[ab]\//, "") : undefined;
    for (const hunk of patch.hunks) {
      let old = hunk.oldStart;
      let next = hunk.newStart;
      const lines: DiffLine[] = [];
      for (const raw of hunk.lines) {
        // "\ No newline at end of file" belongs to the line before; it is not a line of its own.
        const change = CHANGES[raw[0] ?? ""];
        if (!change) continue;
        const text = raw.slice(1);
        if (change === "add") {
          added++;
          lines.push({ change, text, new: next++ });
        } else if (change === "remove") {
          removed++;
          lines.push({ change, text, old: old++ });
        } else lines.push({ change, text, old: old++, new: next++ });
      }
      const header = `@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`;
      hunks.push(file ? { header, file, lines } : { header, lines });
    }
  }
  return { hunks, added, removed };
}

/** The difference between two texts, with the given lines of context around each change. */
export const diffTexts = (before: string, after: string, context: number): DiffModel =>
  fromStructured([structuredPatch("", "", before, after, undefined, undefined, { context })]);

/** A ready unified diff, of one file or more. */
export const diffPatch = (patch: string): DiffModel => fromStructured(parsePatch(patch));

/** One row of the side-by-side view: the old line on the left, the new one on the right. */
export interface SplitRow {
  readonly left?: DiffLine;
  readonly right?: DiffLine;
}

/** Pairs the removed lines of a change with the added lines that follow them, row by row. */
export function splitRows(lines: readonly DiffLine[]): SplitRow[] {
  const rows: SplitRow[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line) break;
    if (line.change === "context") {
      rows.push({ left: line, right: line });
      i++;
      continue;
    }
    const removed: DiffLine[] = [];
    const added: DiffLine[] = [];
    while (lines[i]?.change === "remove") removed.push(lines[i++] as DiffLine);
    while (lines[i]?.change === "add") added.push(lines[i++] as DiffLine);
    for (let k = 0; k < Math.max(removed.length, added.length); k++) {
      const left = removed[k];
      const right = added[k];
      rows.push(left && right ? { left, right } : left ? { left } : right ? { right } : {});
    }
  }
  return rows;
}
