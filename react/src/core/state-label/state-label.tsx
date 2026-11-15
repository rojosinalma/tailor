import { danger, info, success, warning } from "@tailor/core/glyphs.gen";
import type spec from "@tailor/packs/core/state-label/spec";
import type { ReactNode } from "react";
import { Glyph } from "../../glyph";

type Tone = (typeof spec.props.tone)[number];

const DEFAULT_ICON: Partial<Record<Tone, string>> = { success, warning, danger, info };

export interface StateLabelProps {
  tone?: Tone;
  /** Replaces the default icon of the tone. `null` shows no icon. */
  icon?: ReactNode;
  /** The state in words. */
  children: ReactNode;
}

/** A status in words with an icon, such as Running or Failed. */
export function StateLabel({ tone = "neutral", icon, children }: StateLabelProps) {
  const body = DEFAULT_ICON[tone];
  const shown = icon === undefined ? body && <Glyph body={body} /> : icon;
  return (
    <span className="t-state" data-tone={tone}>
      {shown ? <span className="t-state-icon">{shown}</span> : null}
      {children}
    </span>
  );
}
