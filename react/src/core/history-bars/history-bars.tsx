import type { Tone } from "@tailor/core/spec";
import type spec from "@tailor/packs/core/history-bars/spec";

export interface HistoryItem {
  readonly tone: Tone;
  /** What the period was, for screen readers: "Nov 3: up". */
  readonly label: string;
}

export interface HistoryBarsProps {
  /** One item per period, oldest first. */
  items: readonly HistoryItem[];
  /** The accessible name of the whole chart: "Uptime of web-1, last 30 days". */
  label: string;
  size?: (typeof spec.props.size)[number];
}

/** A row of thin equal bars, one per period, each with a tone. */
export function HistoryBars({ items, label, size = "md" }: HistoryBarsProps) {
  return (
    <ol className="t-history" aria-label={label} data-size={size === "md" ? undefined : size}>
      {items.map((item, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: a bar is its place in the list.
        <li key={i} className="t-history-bar" data-tone={item.tone}>
          <span className="t-sr-only">{item.label}</span>
        </li>
      ))}
    </ol>
  );
}
