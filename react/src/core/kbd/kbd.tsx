import { Fragment, type ReactNode } from "react";

export type KbdProps =
  /** One key. */
  | { children: ReactNode; keys?: never }
  /** A combination, such as ["Ctrl", "K"]: the keys with a plus between them. */
  | { keys: readonly string[]; children?: never };

/** A keyboard key, or a combination of keys. */
export function Kbd({ children, keys }: KbdProps) {
  if (!keys) return <kbd className="t-kbd">{children}</kbd>;
  return (
    <kbd className="t-kbd-keys">
      {keys.map((key, i) => (
        <Fragment key={key}>
          {i > 0 ? "+" : null}
          <kbd className="t-kbd">{key}</kbd>
        </Fragment>
      ))}
    </kbd>
  );
}
