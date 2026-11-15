import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { star, starFill } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import type spec from "@tailor/packs/pickers/rating/spec";
import { Glyph } from "../../glyph";
import { useIsStatic } from "../../kit";

export interface RatingProps {
  /** 1 to `max`; 0 or none for no rating yet. */
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** The number of stars. */
  max?: number;
  /** The field name in a form. */
  name: string;
  /** The accessible name of the group. */
  label: string;
  /** Shows the rating as an image, e.g. "Quality: 4 of 5". */
  readOnly?: boolean;
  disabled?: boolean;
  size?: (typeof spec.props.size)[number];
}

const outOf = (n: number, max: number): string => `${n} ${t("of")} ${max}`;

function Stars() {
  return (
    <span className="t-rating-glyph" aria-hidden="true">
      <Glyph body={star} />
      <Glyph body={starFill} />
    </span>
  );
}

/** A rating from 1 to `max`, drawn as stars. */
export function Rating({
  value,
  defaultValue,
  onValueChange,
  max = 5,
  name,
  label,
  readOnly,
  disabled,
  size = "md",
}: RatingProps) {
  const isStatic = useIsStatic();
  const dataSize = size === "md" ? undefined : size;
  const stars = Array.from({ length: Math.max(1, Math.round(max)) }, (_, i) => i + 1);
  const current = value ?? defaultValue ?? 0;

  if (readOnly) {
    return (
      <div
        className="t-rating"
        role="img"
        aria-label={`${label}: ${outOf(current, stars.length)}`}
        data-size={dataSize}
        data-readonly=""
      >
        {stars.map((n) => (
          <span key={n} className="t-rating-star" data-filled={n <= current ? "" : undefined}>
            <Stars />
          </span>
        ))}
      </div>
    );
  }

  if (isStatic) {
    return (
      <div
        className="t-rating"
        role="radiogroup"
        aria-label={label}
        data-size={dataSize}
        data-disabled={disabled ? "" : undefined}
      >
        {stars.map((n) => (
          <label key={n} className="t-rating-star">
            <input
              type="radio"
              className="t-rating-input"
              name={name}
              value={n}
              defaultChecked={n === current}
              disabled={disabled}
            />
            <Stars />
            <span className="t-sr-only">{outOf(n, stars.length)}</span>
          </label>
        ))}
      </div>
    );
  }

  return (
    <RadioGroup
      className="t-rating"
      aria-label={label}
      data-size={dataSize}
      value={value}
      defaultValue={value === undefined ? defaultValue : undefined}
      onValueChange={(next) => {
        if (typeof next === "number") onValueChange?.(next);
      }}
      name={name}
      disabled={disabled}
    >
      {stars.map((n) => (
        <Radio.Root key={n} className="t-rating-star" value={n}>
          <Stars />
          <span className="t-sr-only">{outOf(n, stars.length)}</span>
        </Radio.Root>
      ))}
    </RadioGroup>
  );
}
