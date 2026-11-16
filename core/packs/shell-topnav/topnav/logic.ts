/**
 * Which links of a top bar fit in one row. `widths` holds each link's width with its gap; when they do not
 * all fit, a "More" menu of `moreWidth` takes the last place and the links that do not fit go into it, last
 * ones first. The current link (`currentIndex`, -1 for none) stays visible when it fits: it takes the place
 * of the last visible ones. Returns the visible indexes in order.
 */
export function fit(
  widths: readonly number[],
  available: number,
  moreWidth: number,
  currentIndex: number,
): number[] {
  const all = widths.map((_, i) => i);
  if (widths.reduce((sum, w) => sum + w, 0) <= available) return all;
  const budget = available - moreWidth;
  const visible: number[] = [];
  let used = 0;
  for (const i of all) {
    const w = widths[i] ?? 0;
    if (used + w > budget) break;
    visible.push(i);
    used += w;
  }
  const current = widths[currentIndex];
  if (current !== undefined && !visible.includes(currentIndex)) {
    while (visible.length > 0 && used + current > budget) used -= widths[visible.pop() ?? 0] ?? 0;
    if (used + current <= budget) visible.push(currentIndex);
  }
  return visible.sort((a, b) => a - b);
}
