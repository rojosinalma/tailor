import type spec from "@tailor/packs/shell-bare/bare/spec";
import { type ReactNode, useId } from "react";
import {
  type FooterFact,
  ShellBar,
  type ShellBrand,
  ShellBrandLink,
  ShellFooter,
  ShellMain,
  ShellRoot,
  type ShellThemePart,
} from "../../core/shell-base/shell-base";

export interface BareShellProps {
  brand?: ShellBrand;
  footer?: FooterFact[];
  /** The theme controls next to the footer facts. Default none. */
  theme?: readonly ShellThemePart[] | false;
  /** "center": the content in the middle at a card's width (sign-in). "start": the whole screen (a Page in fill mode). */
  align: (typeof spec.props.align)[number];
  /** For previews: fills its parent instead of the screen. */
  contained?: boolean;
  children: ReactNode;
}

/** The bare shell: no navigation. For sign-in, error and offline pages and full-screen views. */
export function BareShell({ brand, footer = [], theme = false, align, contained, children }: BareShellProps) {
  const main = useId();
  const center = align === "center";
  return (
    <ShellRoot shell="bare" mainId={main} contained={contained} data-align={center ? "center" : undefined}>
      {brand && !center ? (
        <ShellBar>
          <ShellBrandLink brand={brand} />
        </ShellBar>
      ) : null}
      <ShellMain id={main}>
        {center ? (
          <div className="t-bare-column">
            {brand ? <ShellBrandLink brand={brand} /> : null}
            {children}
          </div>
        ) : (
          children
        )}
      </ShellMain>
      <ShellFooter facts={footer} theme={theme} />
    </ShellRoot>
  );
}
