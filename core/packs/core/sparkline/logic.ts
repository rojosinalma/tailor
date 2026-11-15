/** Sparkline maths: values to SVG path data in a 100 × 100 box. No DOM. */

export interface SparkPaths {
  /** The line through the values. */
  readonly line: string;
  /** The line closed down to the bottom edge, for the area under it. */
  readonly area: string;
}

const round = (n: number): number => Math.round(n * 100) / 100;

/**
 * The scale runs from 0 (or the lowest value, when one is below 0) to the highest value, so a run of equal
 * values is a flat line: at the bottom when they are all 0, at the top otherwise. One value is a flat line
 * across the width. No values (or none that is finite) gives null.
 */
export function sparkPaths(values: readonly number[]): SparkPaths | null {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return null;
  const low = Math.min(0, ...finite);
  const high = Math.max(...finite);
  const span = high - low;
  const y = (v: number): number =>
    span === 0 ? (high === 0 ? 100 : 0) : round(100 - ((v - low) / span) * 100);
  const points =
    finite.length === 1
      ? [`0,${y(finite[0] ?? 0)}`, `100,${y(finite[0] ?? 0)}`]
      : finite.map((v, i) => `${round((i / (finite.length - 1)) * 100)},${y(v)}`);
  const line = `M${points.join("L")}`;
  return { line, area: `${line}L100,100L0,100Z` };
}
