import type spec from "@tailor/packs/core/icon/spec";
import { type ReactNode, use } from "react";
import { SpriteContext } from "../../kit";

type IconSet = (typeof spec.props.set)[number];
export type IconName = `${IconSet}:${string}`;

/** Sets the address of the icon sprite for the icons below it. */
export function IconSprite({ href, children }: { href: string; children: ReactNode }) {
  return <SpriteContext value={href}>{children}</SpriteContext>;
}

export interface IconProps {
  /** Set and icon, for example "bi:house". */
  name: IconName;
  /** Give a label when the icon carries meaning. Without one, the icon is decoration. */
  label?: string;
}

export function Icon({ name, label }: IconProps) {
  const sprite = use(SpriteContext);
  return (
    <svg
      className="t-icon"
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label}
    >
      <use href={`${sprite}#${name.replace(":", "-")}`} />
    </svg>
  );
}
