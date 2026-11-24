import type spec from "@tailor/packs/core/facts/spec";
import type { ReactNode } from "react";

export interface FactItem {
  key: string;
  value: ReactNode;
  /** Sets the value in the mono font: ids, addresses, hashes. */
  mono?: boolean;
  /** A Help after the key that explains it. */
  help?: ReactNode;
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
  /** A Help after the key that explains it. */
  help?: ReactNode;
  /** The value. */
  children: ReactNode;
}

/** A key with its help: the last word and the help button stay on one line. */
function KeyWithHelp({ name, help }: { name: string; help: ReactNode }) {
  const cut = name.lastIndexOf(" ");
  return (
    <>
      {cut > 0 ? `${name.slice(0, cut)} ` : null}
      <span className="t-facts-key-end">
        {name.slice(cut + 1)} {help}
      </span>
    </>
  );
}

/** One key and its value, inside Facts. */
export function Fact({ name, mono, help, children }: FactProps) {
  return (
    <div className="t-facts-row">
      <dt className="t-facts-key">{help ? <KeyWithHelp name={name} help={help} /> : name}</dt>
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
        <Fact key={item.key} name={item.key} mono={item.mono} help={item.help}>
          {item.value}
        </Fact>
      ))}
      {children}
    </dl>
  );
}
