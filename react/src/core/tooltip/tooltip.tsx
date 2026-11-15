import { Tooltip as Base } from "@base-ui/react/tooltip";
import { cloneElement, type ReactElement } from "react";
import { useIsStatic } from "../../kit";

export interface TooltipProps {
  /** The name of the control. It repeats the control's label and holds nothing more. */
  text: string;
  /** The control, usually an icon-only Button with the same text as its label. */
  children: ReactElement<{ "data-t"?: string }>;
}

/** Shows the name of an icon-only control on hover and on keyboard focus. Never on touch. */
export function Tooltip({ text, children }: TooltipProps) {
  const isStatic = useIsStatic();

  if (isStatic) {
    const hooks = [children.props["data-t"], "tooltip"].filter(Boolean).join(" ");
    return cloneElement(children, { "data-t": hooks, "data-tip": text } as Record<string, string>);
  }

  return (
    <Base.Root>
      <Base.Trigger render={children} />
      <Base.Portal>
        <Base.Positioner className="t-tooltip-positioner" side="top" sideOffset={6}>
          <Base.Popup className="t-tooltip">{text}</Base.Popup>
        </Base.Positioner>
      </Base.Portal>
    </Base.Root>
  );
}
