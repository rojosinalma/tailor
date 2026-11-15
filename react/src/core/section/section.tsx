import type { ReactNode } from "react";

export interface SectionProps {
  /** The h2 of the section. */
  title: string;
  description?: ReactNode;
  /** The section actions, at the end of the header. */
  actions?: ReactNode;
  children?: ReactNode;
}

/** A titled block inside a page. */
export function Section({ title, description, actions, children }: SectionProps) {
  return (
    <section className="t-section">
      <header className="t-section-header">
        <div className="t-section-heading">
          <h2 className="t-section-title">{title}</h2>
          {description ? <p className="t-section-description">{description}</p> : null}
        </div>
        {actions ? <div className="t-section-actions">{actions}</div> : null}
      </header>
      <div className="t-section-body">{children}</div>
    </section>
  );
}
