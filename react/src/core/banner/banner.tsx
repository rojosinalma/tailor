import { close } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import type spec from "@tailor/packs/core/banner/spec";
import type { ReactNode } from "react";
import { Glyph } from "../../glyph";
import { TONE_GLYPH, toneRole } from "../alert/alert";

export interface BannerProps {
  tone?: (typeof spec.props.tone)[number];
  /** The glyph before the text. Default: the tone's glyph, as an Alert has. */
  icon?: ReactNode;
  /** false: no live role, for a banner inside a live region that stays in the page. Default true. */
  live?: boolean;
  /** One button, such as "Reload". */
  action?: ReactNode;
  /** Shows the close button. In the HTML kit the app adds the click handler. */
  onClose?: () => void;
  /** The message, one short sentence. */
  children: ReactNode;
}

export function Banner({ tone = "info", icon, live = true, action, onClose, children }: BannerProps) {
  return (
    <div className="t-banner" data-tone={tone} role={live ? toneRole(tone) : undefined}>
      <span className="t-banner-icon">{icon ?? <Glyph body={TONE_GLYPH[tone]} />}</span>
      <div className="t-banner-text">{children}</div>
      {action ? <div className="t-banner-action">{action}</div> : null}
      {onClose ? (
        <button type="button" className="t-banner-close" aria-label={t("close")} onClick={onClose}>
          <Glyph body={close} />
        </button>
      ) : null}
    </div>
  );
}
