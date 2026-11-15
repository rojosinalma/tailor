import { PreviewCard as Base } from "@base-ui/react/preview-card";
import type { ReactNode } from "react";
import { useIsStatic } from "../../kit";
import { AppLink } from "../../link";

/** The wait before the card opens. Behaviour, not animation: it stays under reduced motion. */
const OPEN_DELAY = 400;

export interface HoverCardProps {
  /** The address of the link. */
  to: string;
  /** The preview. It repeats what the target shows; a touch screen never sees it. */
  content: ReactNode;
  /** The link text. */
  children: ReactNode;
}

/** A link that previews its target on hover and on keyboard focus. */
export function HoverCard({ to, content, children }: HoverCardProps) {
  const isStatic = useIsStatic();

  if (isStatic) {
    return (
      <>
        <a className="t-hover-card" data-t="hover-card" href={to}>
          {children}
        </a>
        <template>{content}</template>
      </>
    );
  }

  return (
    <Base.Root>
      <Base.Trigger className="t-hover-card" delay={OPEN_DELAY} render={<AppLink to={to} />}>
        {children}
      </Base.Trigger>
      <Base.Portal>
        <Base.Positioner className="t-hover-card-positioner" sideOffset={4} align="start">
          <Base.Popup className="t-popup t-hover-card-popup">{content}</Base.Popup>
        </Base.Positioner>
      </Base.Portal>
    </Base.Root>
  );
}
