import type { Tone } from "@tailor/core/spec";
import type { ReactNode } from "react";

export interface TimelineProps {
  /** The accessible name of the list of events. */
  label?: string;
  /** TimelineItem elements, in time order. */
  children?: ReactNode;
}

/** Events in time order. */
export function Timeline({ label, children }: TimelineProps) {
  return (
    <ol className="t-timeline" aria-label={label}>
      {children}
    </ol>
  );
}

export interface TimelineItemProps {
  title: ReactNode;
  /** When it happened, for example a RelativeTime. */
  time?: ReactNode;
  tone?: Tone;
  /** An icon instead of the dot. */
  icon?: ReactNode;
  /** More detail. */
  children?: ReactNode;
}

export function TimelineItem({ title, time, tone, icon, children }: TimelineItemProps) {
  return (
    <li className="t-timeline-item" data-tone={tone}>
      <span className="t-timeline-marker" aria-hidden="true">
        <span>{icon}</span>
      </span>
      <div className="t-timeline-content">
        <span className="t-timeline-title">{title}</span>
        {time ? <span className="t-timeline-time">{time}</span> : null}
        {children ? <div className="t-timeline-body">{children}</div> : null}
      </div>
    </li>
  );
}
