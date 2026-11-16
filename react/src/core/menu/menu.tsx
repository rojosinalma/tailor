import { Menu as Base } from "@base-ui/react/menu";
import type spec from "@tailor/packs/core/menu/spec";
import { cloneElement, type ReactElement, useId } from "react";
import { useIsStatic } from "../../kit";
import { MenuEntries, type MenuItem } from "./items";

export type {
  MenuActionItem,
  MenuCheckboxItem,
  MenuGroupItem,
  MenuItem,
  MenuRadioGroupItem,
  MenuRadioOption,
  MenuSeparatorItem,
} from "./items";

export interface MenuProps {
  /** The button that opens the menu, usually a Button. */
  trigger: ReactElement;
  /** The accessible name of the menu. */
  label: string;
  items: readonly MenuItem[];
  /** How the menu lines up with its trigger. */
  align?: (typeof spec.props.align)[number];
  /** "end" opens the menu beside its trigger, as from a collapsed sidebar. */
  side?: (typeof spec.props.side)[number];
}

/** A list of actions that opens from a button. */
export function Menu({ trigger, label, items, align = "start", side = "bottom" }: MenuProps) {
  const id = useId();
  const isStatic = useIsStatic();

  if (isStatic) {
    return (
      <>
        {cloneElement(trigger, {
          "data-t": "menu",
          "data-t-menu": id,
          "aria-haspopup": "menu",
          "aria-expanded": "false",
        } as Record<string, unknown>)}
        <div
          className="t-popup t-menu"
          id={id}
          role="menu"
          aria-label={label}
          data-align={align === "start" ? undefined : align}
          data-side={side === "bottom" ? undefined : side}
          hidden
        >
          <MenuEntries items={items} />
        </div>
      </>
    );
  }

  return (
    <Base.Root>
      <Base.Trigger render={trigger} />
      <Base.Portal>
        <Base.Positioner
          className="t-popup-positioner"
          sideOffset={4}
          side={side === "end" ? "inline-end" : "bottom"}
          align={align}
        >
          <Base.Popup className="t-popup t-menu" aria-label={label}>
            <MenuEntries items={items} />
          </Base.Popup>
        </Base.Positioner>
      </Base.Portal>
    </Base.Root>
  );
}
