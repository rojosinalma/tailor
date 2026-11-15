import { Progress as Base } from "@base-ui/react/progress";
import { t } from "@tailor/core/text";
import type spec from "@tailor/packs/core/progress/spec";
import { type CSSProperties, useId } from "react";
import { useIsStatic } from "../../kit";

export interface ProgressProps {
  /** 0 to 100. null: activity of unknown length. */
  value: number | null;
  /** The accessible name, always required; visible with showLabel. */
  label: string;
  /** Shows the label and the value above the bar. */
  showLabel?: boolean;
  tone?: (typeof spec.props.tone)[number];
  size?: (typeof spec.props.size)[number];
}

const clamp = (value: number): number => Math.min(100, Math.max(0, value));

/** Progress of known length; with value null, activity of unknown length. */
export function Progress({ value, label, showLabel = false, tone, size = "md" }: ProgressProps) {
  const isStatic = useIsStatic();
  const labelId = useId();
  const known = value !== null && Number.isFinite(value);
  const percent = known ? clamp(value) : null;
  // The one inline style the kit allows: the fill width as a single custom property.
  const fill = percent === null ? undefined : ({ "--t-progress": `${percent}%` } as CSSProperties);
  const dataSize = size === "md" ? undefined : size;

  if (isStatic) {
    const text =
      percent === null ? "" : new Intl.NumberFormat(undefined, { style: "percent" }).format(percent / 100);
    return (
      <div
        className="t-progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent ?? undefined}
        aria-valuetext={percent === null ? t("loading") : text}
        aria-label={showLabel ? undefined : label}
        aria-labelledby={showLabel ? labelId : undefined}
        data-tone={tone}
        data-size={dataSize}
        data-indeterminate={percent === null ? "" : undefined}
        data-complete={percent === 100 ? "" : undefined}
        data-progressing={percent !== null && percent < 100 ? "" : undefined}
        style={fill}
      >
        {showLabel ? (
          <>
            <span className="t-progress-label" id={labelId}>
              {label}
            </span>
            {percent === null ? null : (
              <span className="t-progress-value" aria-hidden="true">
                {text}
              </span>
            )}
          </>
        ) : null}
        <div className="t-progress-track">
          <div className="t-progress-fill" />
        </div>
      </div>
    );
  }

  return (
    <Base.Root
      value={percent}
      getAriaValueText={(text, raw) => (raw === null ? t("loading") : text)}
      className="t-progress"
      aria-label={showLabel ? undefined : label}
      data-tone={tone}
      data-size={dataSize}
      style={fill}
    >
      {showLabel ? (
        <>
          <Base.Label className="t-progress-label">{label}</Base.Label>
          {percent === null ? null : <Base.Value className="t-progress-value" />}
        </>
      ) : null}
      <Base.Track className="t-progress-track">
        <div className="t-progress-fill" />
      </Base.Track>
    </Base.Root>
  );
}
