import { Popover as Base } from "@base-ui/react/popover";
import { close } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import type spec from "@tailor/packs/core/popover/spec";
import { cloneElement, type ReactElement, type ReactNode, useId } from "react";
import { Glyph } from "../../glyph";
import { useIsStatic } from "../../kit";

export interface PopoverProps {
  /** The element that opens the popover, usually a Button. */
  trigger: ReactElement<{ "data-t"?: string }>;
  title?: string;
  /** The accessible name of the popover when it has no title. */
  label?: string;
  side?: (typeof spec.props.side)[number];
  align?: (typeof spec.props.align)[number];
  children: ReactNode;
}

/** A small panel anchored to its trigger. On a phone it is a bottom sheet with a close button. */
export function Popover({ trigger, title, label, side = "bottom", align = "start", children }: PopoverProps) {
  const id = useId();
  const isStatic = useIsStatic();

  if (isStatic) {
    const hooks = [trigger.props["data-t"], "popover"].filter(Boolean).join(" ");
    return (
      <>
        {cloneElement(trigger, {
          "data-t": hooks,
          "data-t-popover": id,
          "data-side": side === "bottom" ? undefined : side,
          "data-align": align === "start" ? undefined : align,
        } as Record<string, string | undefined>)}
        <div
          className="t-popup t-popover"
          id={id}
          role="dialog"
          aria-labelledby={title ? `${id}-title` : undefined}
          aria-label={title ? undefined : label}
          hidden
        >
          {title ? (
            <h2 className="t-popover-title" id={`${id}-title`}>
              {title}
            </h2>
          ) : null}
          <button type="button" className="t-popover-close" aria-label={t("close")} data-t-close="">
            <Glyph body={close} />
          </button>
          <div className="t-popover-body">{children}</div>
        </div>
      </>
    );
  }

  return (
    <Base.Root>
      <Base.Trigger render={trigger} />
      <Base.Portal>
        <Base.Positioner className="t-popup-positioner" side={side} align={align} sideOffset={4}>
          <Base.Popup className="t-popup t-popover" aria-label={title ? undefined : label}>
            {title ? <Base.Title className="t-popover-title">{title}</Base.Title> : null}
            <Base.Close className="t-popover-close" aria-label={t("close")}>
              <Glyph body={close} />
            </Base.Close>
            <div className="t-popover-body">{children}</div>
          </Base.Popup>
        </Base.Positioner>
      </Base.Portal>
    </Base.Root>
  );
}
