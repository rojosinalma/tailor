import { Tooltip as Base } from "@base-ui/react/tooltip";
import type spec from "@tailor/packs/core/tooltip/spec";
import { cloneElement, type ReactElement } from "react";
import { useIsStatic } from "../../kit";

export interface TooltipProps {
  /** The name of the control. It repeats the control's label and holds nothing more. */
  text: string;
  /** The control, usually an icon-only Button with the same text as its label. */
  children: ReactElement<{ "data-t"?: string }>;
  /** Where it opens, on the side of the line's start or end in "start" and "end". Default "top". */
  side?: (typeof spec.props.side)[number];
}

const BASE_SIDE = { top: "top", bottom: "bottom", start: "inline-start", end: "inline-end" } as const;

/** Shows the name of an icon-only control on hover and on keyboard focus. Never on touch. */
export function Tooltip({ text, children, side = "top" }: TooltipProps) {
  const isStatic = useIsStatic();

  if (isStatic) {
    const hooks = [children.props["data-t"], "tooltip"].filter(Boolean).join(" ");
    const attributes: Record<string, string> = { "data-t": hooks, "data-tip": text };
    if (side !== "top") attributes["data-tip-side"] = side;
    return cloneElement(children, attributes);
  }

  return (
    <Base.Root>
      <Base.Trigger render={children} />
      <Base.Portal>
        <Base.Positioner className="t-tooltip-positioner" side={BASE_SIDE[side]} sideOffset={6}>
          <Base.Popup className="t-tooltip">{text}</Base.Popup>
        </Base.Positioner>
      </Base.Portal>
    </Base.Root>
  );
}
