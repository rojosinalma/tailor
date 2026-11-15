import { Dialog as Base } from "@base-ui/react/dialog";
import { close } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import { swipeCloses, swipeOffset } from "@tailor/packs/core/drawer/logic";
import type spec from "@tailor/packs/core/drawer/spec";
import {
  cloneElement,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
  useId,
  useRef,
} from "react";
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

const GRIP = ".t-drawer-handle, .t-drawer-header";

/** A downward swipe on the handle or the header closes a bottom drawer. The HTML kit's script does the same. */
function useSwipe(actions: RefObject<Base.Root.Actions | null>) {
  const drag = useRef<number | null>(null);
  const end = (event: PointerEvent<HTMLElement>): void => {
    const start = drag.current;
    if (start === null) return;
    drag.current = null;
    const sheet = event.currentTarget;
    sheet.removeAttribute("data-swiping");
    const closes = swipeCloses(swipeOffset(start, event.clientY), sheet.offsetHeight);
    if (event.type === "pointerup" && closes) {
      sheet.style.translate = "0 100%";
      actions.current?.close();
    } else sheet.style.translate = "";
  };
  return {
    onPointerDown(event: PointerEvent<HTMLElement>) {
      const target = event.target;
      if (event.button !== 0 || !(target instanceof Element)) return;
      const grip = target.closest<HTMLElement>(GRIP);
      if (!grip || target.closest("button, a, input")) return;
      // Capture on the grip, so the click that ends the swipe stays on it.
      grip.setPointerCapture(event.pointerId);
      drag.current = event.clientY;
      event.currentTarget.setAttribute("data-swiping", "");
    },
    onPointerMove(event: PointerEvent<HTMLElement>) {
      const start = drag.current;
      if (start !== null) event.currentTarget.style.translate = `0 ${swipeOffset(start, event.clientY)}px`;
    },
    onPointerUp: end,
    onPointerCancel: end,
  };
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
  const actions = useRef<Base.Root.Actions | null>(null);
  const swipe = useSwipe(actions);
  const bottom = side === "bottom";
  const handle = bottom ? <div className="t-drawer-handle" aria-hidden="true" /> : null;
  const dataSide = side === "end" ? undefined : side;
  const dataSize = size === "sm" ? undefined : size;

  if (isStatic) {
    return (
      <>
        {trigger ? cloneElement(trigger, { "data-t-open": id } as Record<string, unknown>) : null}
        <dialog
          className="t-drawer"
          id={id}
          data-t="dialog drawer"
          data-side={dataSide}
          data-size={dataSize}
          aria-labelledby={`${id}-title`}
        >
          {handle}
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
    <Base.Root open={open} onOpenChange={onOpenChange} actionsRef={actions}>
      {trigger ? <Base.Trigger render={trigger} /> : null}
      <Base.Portal>
        <Base.Backdrop className="t-drawer-backdrop" />
        <Base.Popup className="t-drawer" data-side={dataSide} data-size={dataSize} {...(bottom ? swipe : {})}>
          {handle}
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
