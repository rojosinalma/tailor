/** The text form of a list (one value per line) and the moves of the list editor. */

/** The values of a text with one value per line: trimmed, without empty lines. */
export function parseLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "");
}

/** One value per line; empty values are left out. */
export function joinLines(items: readonly string[]): string {
  return items
    .map((item) => item.trim())
    .filter((item) => item !== "")
    .join("\n");
}

/** The list with the item at `from` moved to `to`. An index outside the list changes nothing. */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items];
  if (from < 0 || from >= next.length || to < 0 || to >= next.length) return next;
  const [item] = next.splice(from, 1);
  if (item !== undefined) next.splice(to, 0, item);
  return next;
}

/** True while one more row fits. */
export const canAdd = (count: number, max: number | undefined): boolean => max === undefined || count < max;
