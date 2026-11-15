import { close, danger, info, success, warning } from "@tailor/core/glyphs.gen";
import type { Tone } from "@tailor/core/spec";
import { t } from "@tailor/core/text";
import type spec from "@tailor/packs/core/alert/spec";
import type { ReactNode } from "react";
import { Glyph } from "../../glyph";

/** The glyph of each tone; the tones without an own glyph show the info glyph. */
export const TONE_GLYPH: Record<Tone, string> = {
  neutral: info,
  accent: info,
  info,
  success,
  warning,
  danger,
};

/** Danger and warning interrupt the screen reader; the other tones wait for a pause. */
export const toneRole = (tone: Tone): "alert" | "status" =>
  tone === "danger" || tone === "warning" ? "alert" : "status";

export interface AlertProps {
  tone?: (typeof spec.props.tone)[number];
  title?: string;
  /** Buttons under the message. */
  actions?: ReactNode;
  /** Shows the close button. In the HTML kit the app adds the click handler. */
  onClose?: () => void;
  /** The message. */
  children: ReactNode;
}

export function Alert({ tone = "info", title, actions, onClose, children }: AlertProps) {
  return (
    <div className="t-alert" data-tone={tone} role={toneRole(tone)}>
      <span className="t-alert-icon">
        <Glyph body={TONE_GLYPH[tone]} />
      </span>
      <div className="t-alert-content">
        {title ? <p className="t-alert-title">{title}</p> : null}
        <div className="t-alert-text">{children}</div>
        {actions ? <div className="t-alert-actions">{actions}</div> : null}
      </div>
      {onClose ? (
        <button type="button" className="t-alert-close" aria-label={t("close")} onClick={onClose}>
          <Glyph body={close} />
        </button>
      ) : null}
    </div>
  );
}
