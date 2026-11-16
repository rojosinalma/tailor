/** The text form of pairs (one KEY=value per line) and the checks of the key-value editor. */

export interface Pair {
  readonly key: string;
  readonly value: string;
}

/** The pairs of KEY=value lines. Blank lines and # comments are left out; a line with no = is a key. */
export function parsePairs(text: string): Pair[] {
  const pairs: Pair[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line === "" || line.startsWith("#")) continue;
    const at = line.indexOf("=");
    pairs.push(
      at < 0 ? { key: line, value: "" } : { key: line.slice(0, at).trim(), value: line.slice(at + 1).trim() },
    );
  }
  return pairs;
}

/** One KEY=value per line; pairs with no key are left out. */
export function joinPairs(pairs: readonly Pair[]): string {
  return pairs
    .filter((pair) => pair.key.trim() !== "")
    .map((pair) => `${pair.key.trim()}=${pair.value}`)
    .join("\n");
}

/** The keys that more than one pair holds. */
export function duplicateKeys(pairs: readonly Pair[]): Set<string> {
  const seen = new Set<string>();
  const twice = new Set<string>();
  for (const { key } of pairs) {
    const name = key.trim();
    if (name === "") continue;
    if (seen.has(name)) twice.add(name);
    seen.add(name);
  }
  return twice;
}

/** True when the key holds one of the words, in any case: its value is hidden. */
export const isSecretKey = (key: string, words: readonly string[] | undefined): boolean =>
  words?.some((word) => word !== "" && key.toUpperCase().includes(word.toUpperCase())) === true;

/** The pairs in a pasted text when it holds KEY=value lines; null for plain text that is pasted as is. */
export function pastedPairs(text: string): Pair[] | null {
  if (!text.includes("=")) return null;
  const pairs = parsePairs(text);
  return pairs.length > 0 ? pairs : null;
}
