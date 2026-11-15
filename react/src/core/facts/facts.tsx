import type spec from "@tailor/packs/core/facts/spec";
import type { ReactNode } from "react";

export interface FactItem {
  key: string;
  value: ReactNode;
  /** Sets the value in the mono font: ids, addresses, hashes. */
  mono?: boolean;
}

export interface FactsProps {
  layout?: (typeof spec.props.layout)[number];
  /** The facts. Or give Fact rows as children. */
  items?: readonly FactItem[];
  children?: ReactNode;
}

export interface FactProps {
  /** The key. */
  name: string;
  mono?: boolean;
  /** The value. */
  children: ReactNode;
}

/** One key and its value, inside Facts. */
export function Fact({ name, mono, children }: FactProps) {
  return (
    <div className="t-facts-row">
      <dt className="t-facts-key">{name}</dt>
      <dd className="t-facts-value" data-mono={mono ? "" : undefined}>
        {children}
      </dd>
    </div>
  );
}

/** A list of keys and values. */
export function Facts({ layout = "rows", items, children }: FactsProps) {
  return (
    <dl className="t-facts" data-layout={layout === "rows" ? undefined : layout}>
      {items?.map((item) => (
        <Fact key={item.key} name={item.key} mono={item.mono}>
          {item.value}
        </Fact>
      ))}
      {children}
    </dl>
  );
}
