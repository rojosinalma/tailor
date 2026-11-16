import { Dialog as Base } from "@base-ui/react/dialog";
import { close } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import type spec from "@tailor/packs/core/dialog/spec";
import { cloneElement, type ReactElement, type ReactNode, type RefObject, useId, useRef } from "react";
import { Glyph } from "../../glyph";
import { OverlayContext, useIsStatic } from "../../kit";

export interface DialogProps {
  /** The element that opens the dialog, usually a Button. Leave out for a dialog that the code opens. */
  trigger?: ReactElement;
  /** The heading; with hideHeader, only the accessible name. */
  title: string;
  size?: (typeof spec.props.size)[number];
  /** "top" puts the dialog near the top of the screen, as a command palette. On a phone it takes the full screen either way. */
  placement?: (typeof spec.props.placement)[number];
  /** No visible header and no close button: Escape and the backdrop close it, or a DialogClose in the content. */
  hideHeader?: boolean;
  /** The element that takes the focus on open. Default: the first focusable element. */
  initialFocus?: RefObject<HTMLElement | null>;
  /** The actions. Wrap a button in DialogClose to make it close the dialog. */
  footer?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

const withProps = (element: ReactElement, props: Record<string, unknown>): ReactElement =>
  cloneElement(element, props);

export function Dialog({
  trigger,
  title,
  size = "md",
  placement = "center",
  hideHeader = false,
  initialFocus,
  footer,
  open,
  onOpenChange,
  children,
}: DialogProps) {
  const id = useId();
  const isStatic = useIsStatic();
  const popup = useRef<HTMLDivElement>(null);
  const dataSize = size === "md" ? undefined : size;
  const dataPlacement = placement === "center" ? undefined : placement;

  if (isStatic) {
    return (
      <>
        {trigger ? withProps(trigger, { "data-t-open": id }) : null}
        <dialog
          className="t-dialog"
          id={id}
          data-t="dialog"
          data-size={dataSize}
          data-placement={dataPlacement}
          aria-labelledby={`${id}-title`}
        >
          {hideHeader ? (
            <h2 className="t-sr-only" id={`${id}-title`}>
              {title}
            </h2>
          ) : (
            <header className="t-dialog-header">
              <h2 className="t-dialog-title" id={`${id}-title`}>
                {title}
              </h2>
              <button type="button" className="t-dialog-close" aria-label={t("close")} data-t-close="">
                <Glyph body={close} />
              </button>
            </header>
          )}
          <div className="t-dialog-body">{children}</div>
          {footer ? <footer className="t-dialog-footer">{footer}</footer> : null}
        </dialog>
      </>
    );
  }

  return (
    <Base.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <Base.Trigger render={trigger} /> : null}
      <Base.Portal>
        <Base.Backdrop className="t-dialog-backdrop" />
        <Base.Popup
          ref={popup}
          className="t-dialog"
          data-size={dataSize}
          data-placement={dataPlacement}
          initialFocus={initialFocus}
        >
          <OverlayContext value={popup}>
            {hideHeader ? (
              <Base.Title className="t-sr-only">{title}</Base.Title>
            ) : (
              <header className="t-dialog-header">
                <Base.Title className="t-dialog-title">{title}</Base.Title>
                <Base.Close className="t-dialog-close" aria-label={t("close")}>
                  <Glyph body={close} />
                </Base.Close>
              </header>
            )}
            <div className="t-dialog-body">{children}</div>
            {footer ? <footer className="t-dialog-footer">{footer}</footer> : null}
          </OverlayContext>
        </Base.Popup>
      </Base.Portal>
    </Base.Root>
  );
}

/** Makes its child, a button, close the dialog that holds it. */
export function DialogClose({ children }: { children: ReactElement }) {
  const isStatic = useIsStatic();
  return isStatic ? withProps(children, { "data-t-close": "" }) : <Base.Close render={children} />;
}
