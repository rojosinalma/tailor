import { Drawer, type DrawerProps } from "../drawer/drawer";

export type BottomSheetProps = Omit<DrawerProps, "side" | "size">;

/** A sheet from the bottom for a menu of choices or a short form on a phone. */
export function BottomSheet(props: BottomSheetProps) {
  return <Drawer {...props} side="bottom" />;
}
