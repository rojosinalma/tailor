import { Dialog as Base } from "@base-ui/react/dialog";
import { close } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import type spec from "@tailor/packs/core/dialog/spec";
import { cloneElement, type ReactElement, type ReactNode, useId } from "react";
import { Glyph } from "../../glyph";
import { useIsStatic } from "../../kit";

export interface DialogProps {
  /** The element that opens the dialog, usually a Button. Leave out for a dialog that the code opens. */
  trigger?: ReactElement;
  title: string;
  size?: (typeof spec.props.size)[number];
  /** The actions. Wrap a button in DialogClose to make it close the dialog. */
  footer?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

const withProps = (element: ReactElement, props: Record<string, unknown>): ReactElement =>
  cloneElement(element, props);

export function Dialog({ trigger, title, size = "md", footer, open, onOpenChange, children }: DialogProps) {
  const id = useId();
  const isStatic = useIsStatic();
  const dataSize = size === "md" ? undefined : size;

  if (isStatic) {
    return (
      <>
        {trigger ? withProps(trigger, { "data-t-open": id }) : null}
        <dialog
          className="t-dialog"
          id={id}
          data-t="dialog"
          data-size={dataSize}
          aria-labelledby={`${id}-title`}
        >
          <header className="t-dialog-header">
            <h2 className="t-dialog-title" id={`${id}-title`}>
              {title}
            </h2>
            <button type="button" className="t-dialog-close" aria-label={t("close")} data-t-close="">
              <Glyph body={close} />
            </button>
          </header>
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
        <Base.Popup className="t-dialog" data-size={dataSize}>
          <header className="t-dialog-header">
            <Base.Title className="t-dialog-title">{title}</Base.Title>
            <Base.Close className="t-dialog-close" aria-label={t("close")}>
              <Glyph body={close} />
            </Base.Close>
          </header>
          <div className="t-dialog-body">{children}</div>
          {footer ? <footer className="t-dialog-footer">{footer}</footer> : null}
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
