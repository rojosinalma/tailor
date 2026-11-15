/** The search of the command palette: a small fuzzy match and the order of the results. */

export interface Match {
  /** Higher is better. */
  readonly score: number;
  /** The indexes of the matched letters in the text. */
  readonly positions: readonly number[];
}

const isWordStart = (text: string, i: number): boolean => {
  if (i === 0) return true;
  const prev = text.charAt(i - 1);
  const here = text.charAt(i);
  return !/[\p{L}\p{N}]/u.test(prev) || (prev === prev.toLowerCase() && here !== here.toLowerCase());
};

/** Whether the letters of `query` from `from` all occur in order in `text` from `at`. */
const fits = (query: string, from: number, text: string, at: number): boolean => {
  let j = at;
  for (let i = from; i < query.length; i++) {
    j = text.indexOf(query.charAt(i), j);
    if (j < 0) return false;
    j++;
  }
  return true;
};

/**
 * Every letter of the query in order (a subsequence), case-insensitive. The score prefers letters at
 * word starts and letters that follow each other; spaces in the query are ignored. Null: no match.
 */
export function fuzzyMatch(query: string, text: string): Match | null {
  const q = query.toLowerCase().replace(/\s+/g, "");
  if (!q) return { score: 0, positions: [] };
  const lower = text.toLowerCase();
  const positions: number[] = [];
  let score = 0;
  let at = 0;
  for (let i = 0; i < q.length; i++) {
    const letter = q.charAt(i);
    const prev = positions[positions.length - 1];
    let found = lower.indexOf(letter, at);
    if (found < 0) return null;
    // Keep a run of letters going; otherwise prefer the next word start that still lets the rest match.
    if (!(prev !== undefined && found === prev + 1)) {
      for (let k = found; k >= 0; k = lower.indexOf(letter, k + 1)) {
        if (isWordStart(text, k)) {
          if (fits(q, i + 1, lower, k + 1)) found = k;
          break;
        }
      }
    }
    const consecutive = prev !== undefined && found === prev + 1;
    score += 1 + (isWordStart(text, found) ? 8 : 0) + (consecutive ? 5 : 0);
    score -= prev === undefined ? Math.min(found, 3) : Math.min(found - prev - 1, 3);
    positions.push(found);
    at = found + 1;
  }
  return { score, positions };
}

/** The label split into the parts to show, each marked as matched or not. */
export function highlight(text: string, positions: readonly number[]): { text: string; match: boolean }[] {
  const parts: { text: string; match: boolean }[] = [];
  const set = new Set(positions);
  for (let i = 0; i < text.length; i++) {
    const match = set.has(i);
    const last = parts[parts.length - 1];
    if (last && last.match === match) last.text += text.charAt(i);
    else parts.push({ text: text.charAt(i), match });
  }
  return parts;
}

export interface Searchable {
  readonly label: string;
  readonly keywords?: readonly string[];
}

/** The match of an item: its label, or one of its keywords, which counts a little less. */
export function matchItem(query: string, item: Searchable): Match | null {
  const label = fuzzyMatch(query, item.label);
  let best = label;
  for (const keyword of item.keywords ?? []) {
    const m = fuzzyMatch(query, keyword);
    if (m && (!best || m.score - 1 > best.score))
      best = { score: m.score - 1, positions: label?.positions ?? [] };
  }
  return best;
}

/**
 * The groups with only their matching items, best first; a group goes as high as its best item.
 * An empty query keeps every group and item in the given order.
 */
export function filterGroups<I extends Searchable, G extends { readonly items: readonly I[] }>(
  groups: readonly G[],
  query: string,
): G[] {
  if (!query.trim()) return [...groups];
  const scored = groups.map((group, order) => {
    const items = group.items
      .map((item, i) => ({ item, i, m: matchItem(query, item) }))
      .filter((x): x is { item: I; i: number; m: Match } => x.m !== null)
      .sort((a, b) => b.m.score - a.m.score || a.i - b.i);
    return { group: { ...group, items: items.map((x) => x.item) }, best: items[0]?.m.score ?? -1, order };
  });
  return scored
    .filter((g) => g.group.items.length > 0)
    .sort((a, b) => b.best - a.best || a.order - b.order)
    .map((g) => g.group);
}

/**
 * The next item to highlight for a key, skipping disabled ones. `enabled` holds one flag per item;
 * -1 when no item can be highlighted. Arrows wrap around; Home and End go to the first and last.
 */
export function moveHighlight(
  enabled: readonly boolean[],
  current: number,
  key: "ArrowDown" | "ArrowUp" | "Home" | "End",
): number {
  const n = enabled.length;
  if (!enabled.some(Boolean)) return -1;
  const step = key === "ArrowDown" || key === "Home" ? 1 : -1;
  let i = key === "Home" || (current < 0 && step > 0) ? -1 : key === "End" || current < 0 ? n : current;
  for (let tries = 0; tries < n; tries++) {
    i = (((i + step) % n) + n) % n;
    if (enabled[i]) return i;
  }
  return -1;
}
