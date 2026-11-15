import { ContextMenu as Base } from "@base-ui/react/context-menu";
import { type ReactNode, useId } from "react";
import { useIsStatic } from "../../kit";
import { MenuEntries, type MenuItem } from "../menu/items";

export interface ContextMenuProps {
  /** The accessible name of the menu. */
  label: string;
  items: readonly MenuItem[];
  /** The area that the menu belongs to. */
  children: ReactNode;
}

/** The menu of an area, opened at the pointer. Always offer the same items in a visible Menu too. */
export function ContextMenu({ label, items, children }: ContextMenuProps) {
  const id = useId();
  const isStatic = useIsStatic();

  if (isStatic) {
    return (
      <>
        <div className="t-context-menu" data-t="context-menu" data-t-menu={id}>
          {children}
        </div>
        <div className="t-popup t-menu" id={id} role="menu" aria-label={label} hidden>
          <MenuEntries items={items} />
        </div>
      </>
    );
  }

  return (
    <Base.Root>
      <Base.Trigger className="t-context-menu">{children}</Base.Trigger>
      <Base.Portal>
        <Base.Positioner className="t-popup-positioner">
          <Base.Popup className="t-popup t-menu" aria-label={label}>
            <MenuEntries items={items} />
          </Base.Popup>
        </Base.Positioner>
      </Base.Portal>
    </Base.Root>
  );
}
