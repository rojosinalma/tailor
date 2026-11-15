import type { ReactNode } from "react";

export interface ButtonGroupProps {
  /** The accessible name of the group. */
  label: string;
  /** The Buttons. */
  children: ReactNode;
}

/** Buttons joined into one control. */
export function ButtonGroup({ label, children }: ButtonGroupProps) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: a group of buttons is an ARIA group; a fieldset is for form fields.
    <div className="t-btn-group" role="group" aria-label={label}>
      {children}
    </div>
  );
}
