import { close, info } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import type spec from "@tailor/packs/core/help/spec";
import { type ReactNode, useId } from "react";
import { Glyph } from "../../glyph";
import { useIsStatic } from "../../kit";
import { Popover } from "../popover/popover";

export interface HelpProps {
  /** The accessible name of the button. */
  label?: string;
  tone?: (typeof spec.props.tone)[number];
  /** The explanation of the field or value next to the button: text, links, emphasis. No paragraphs. */
  children: ReactNode;
}

/** A round info button on the text line that opens a popover with an explanation. */
export function Help({ label = t("moreInformation"), tone = "info", children }: HelpProps) {
  const id = useId();
  const isStatic = useIsStatic();
  const button = (
    <button
      type="button"
      className="t-help"
      data-tone={tone}
      aria-label={label}
      data-t={isStatic ? "popover" : undefined}
      data-t-popover={isStatic ? id : undefined}
    >
      <Glyph body={info} />
    </button>
  );

  // The static panel is made of spans, so the help can sit inside a paragraph or a label.
  if (isStatic) {
    return (
      <>
        {button}
        <span className="t-popup t-popover" id={id} role="dialog" aria-label={label} hidden>
          <button type="button" className="t-popover-close" aria-label={t("close")} data-t-close="">
            <Glyph body={close} />
          </button>
          <span className="t-popover-body">{children}</span>
        </span>
      </>
    );
  }

  return (
    <Popover label={label} trigger={button}>
      {children}
    </Popover>
  );
}
