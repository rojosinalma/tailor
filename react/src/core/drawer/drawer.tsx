import { Dialog as Base } from "@base-ui/react/dialog";
import { close } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import type spec from "@tailor/packs/core/drawer/spec";
import { cloneElement, type ReactElement, type ReactNode, useId } from "react";
import { Glyph } from "../../glyph";
import { useIsStatic } from "../../kit";

export interface DrawerProps {
  /** The element that opens the drawer, usually a Button. Leave out for a drawer that the code opens. */
  trigger?: ReactElement;
  title: string;
  side?: (typeof spec.props.side)[number];
  size?: (typeof spec.props.size)[number];
  /** The actions. Wrap a button in DialogClose to make it close the drawer. */
  footer?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

/** The Dialog parts of Base UI with the drawer's classes; the HTML kit uses the dialog script. */
export function Drawer({
  trigger,
  title,
  side = "end",
  size = "sm",
  footer,
  open,
  onOpenChange,
  children,
}: DrawerProps) {
  const id = useId();
  const isStatic = useIsStatic();
  const dataSide = side === "end" ? undefined : side;
  const dataSize = size === "sm" ? undefined : size;

  if (isStatic) {
    return (
      <>
        {trigger ? cloneElement(trigger, { "data-t-open": id } as Record<string, unknown>) : null}
        <dialog
          className="t-drawer"
          id={id}
          data-t="dialog"
          data-side={dataSide}
          data-size={dataSize}
          aria-labelledby={`${id}-title`}
        >
          <header className="t-drawer-header">
            <h2 className="t-drawer-title" id={`${id}-title`}>
              {title}
            </h2>
            <button type="button" className="t-drawer-close" aria-label={t("close")} data-t-close="">
              <Glyph body={close} />
            </button>
          </header>
          <div className="t-drawer-body">{children}</div>
          {footer ? <footer className="t-drawer-footer">{footer}</footer> : null}
        </dialog>
      </>
    );
  }

  return (
    <Base.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <Base.Trigger render={trigger} /> : null}
      <Base.Portal>
        <Base.Backdrop className="t-drawer-backdrop" />
        <Base.Popup className="t-drawer" data-side={dataSide} data-size={dataSize}>
          <header className="t-drawer-header">
            <Base.Title className="t-drawer-title">{title}</Base.Title>
            <Base.Close className="t-drawer-close" aria-label={t("close")}>
              <Glyph body={close} />
            </Base.Close>
          </header>
          <div className="t-drawer-body">{children}</div>
          {footer ? <footer className="t-drawer-footer">{footer}</footer> : null}
        </Base.Popup>
      </Base.Portal>
    </Base.Root>
  );
}
