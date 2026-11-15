import { Accordion as Base } from "@base-ui/react/accordion";
import { chevronDown } from "@tailor/core/glyphs.gen";
import { type ReactNode, useId } from "react";
import { Glyph } from "../../glyph";
import { useIsStatic } from "../../kit";

export interface AccordionItem {
  readonly id: string;
  readonly title: string;
  readonly content: ReactNode;
  readonly disabled?: boolean;
}

export interface AccordionProps {
  items: readonly AccordionItem[];
  /** Lets several sections be open at once. By default opening one closes the others. */
  multiple?: boolean;
  /** The ids of the sections that start open. */
  defaultOpen?: readonly string[];
}

const chevron = (
  <span className="t-accordion-icon">
    <Glyph body={chevronDown} />
  </span>
);

/** Sections that open and close under their titles. */
export function Accordion({ items, multiple = false, defaultOpen = [] }: AccordionProps) {
  const isStatic = useIsStatic();
  const group = useId();
  // One open section at a time: the first one asked for wins.
  const initial = multiple ? [...defaultOpen] : defaultOpen.slice(0, 1);

  if (isStatic) {
    return (
      <div className="t-accordion">
        {items.map((item) => (
          <details
            key={item.id}
            className="t-accordion-item"
            name={multiple ? undefined : group}
            open={initial.includes(item.id)}
          >
            <summary
              className="t-accordion-trigger"
              aria-disabled={item.disabled ? "true" : undefined}
              tabIndex={item.disabled ? -1 : undefined}
            >
              <span className="t-accordion-title">{item.title}</span>
              {chevron}
            </summary>
            <div className="t-accordion-panel">{item.content}</div>
          </details>
        ))}
      </div>
    );
  }

  return (
    <Base.Root className="t-accordion" multiple={multiple} defaultValue={initial}>
      {items.map((item) => (
        <Base.Item key={item.id} value={item.id} disabled={item.disabled} className="t-accordion-item">
          <Base.Header className="t-accordion-header">
            <Base.Trigger className="t-accordion-trigger">
              <span className="t-accordion-title">{item.title}</span>
              {chevron}
            </Base.Trigger>
          </Base.Header>
          <Base.Panel className="t-accordion-panel">{item.content}</Base.Panel>
        </Base.Item>
      ))}
    </Base.Root>
  );
}
