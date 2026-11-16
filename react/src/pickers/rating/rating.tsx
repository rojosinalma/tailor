import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { star, starFill } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import type spec from "@tailor/packs/pickers/rating/spec";
import { useId } from "react";
import { useFieldControl, useFieldGroup } from "../../core/field/field";
import { Glyph } from "../../glyph";
import { useIsStatic } from "../../kit";

export interface RatingProps {
  /** 1 to `max`; 0 or none for no rating yet. */
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** The number of stars. */
  max?: number;
  /** The field name in a form; a Field around it can give it. */
  name?: string;
  /** The accessible name of the group; inside a Field the field's label names it. */
  label?: string;
  /** Shows the rating as an image, e.g. "Quality: 4 of 5". */
  readOnly?: boolean;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  "aria-describedby"?: string;
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
  required,
  id,
  "aria-describedby": describedBy,
  size = "md",
}: RatingProps) {
  const isStatic = useIsStatic();
  const valueId = useId();
  const field = useFieldControl({ id, name, disabled, required, "aria-describedby": describedBy });
  // Inside a Field, its label names the group.
  const inField = useFieldGroup();
  const labelledBy = label ? undefined : inField?.["aria-labelledby"];
  const named = {
    id: field.id,
    "aria-label": label,
    "aria-labelledby": labelledBy,
    "aria-describedby": field["aria-describedby"],
  };
  const dataSize = size === "md" ? undefined : size;
  const stars = Array.from({ length: Math.max(1, Math.round(max)) }, (_, i) => i + 1);
  const current = value ?? defaultValue ?? 0;

  if (readOnly) {
    return (
      <div
        className="t-rating"
        role="img"
        {...named}
        aria-label={label ? `${label}: ${outOf(current, stars.length)}` : undefined}
        aria-labelledby={labelledBy ? `${labelledBy} ${valueId}` : undefined}
        data-size={dataSize}
        data-readonly=""
      >
        <span className="t-sr-only" id={valueId}>
          {outOf(current, stars.length)}
        </span>
        {stars.map((n) => (
          <span key={n} className="t-rating-star" data-rated={n <= current ? "" : undefined}>
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
        {...named}
        aria-invalid={field["aria-invalid"]}
        aria-required={field.required}
        data-size={dataSize}
        data-disabled={field.disabled ? "" : undefined}
      >
        {stars.map((n) => (
          <label key={n} className="t-rating-star">
            <input
              type="radio"
              className="t-rating-input"
              name={field.name}
              value={n}
              defaultChecked={n === current}
              disabled={field.disabled}
              required={field.required}
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
      {...named}
      aria-invalid={field["aria-invalid"]}
      aria-required={field.required}
      data-size={dataSize}
      value={value}
      defaultValue={value === undefined ? defaultValue : undefined}
      onValueChange={(next) => {
        if (typeof next === "number") onValueChange?.(next);
      }}
      name={field.name}
      disabled={field.disabled}
      required={field.required}
    >
      {stars.map((n) => (
        // Inside a Field, Base UI would name each radio by the field's label: each names itself.
        <Radio.Root key={n} className="t-rating-star" value={n} aria-labelledby={`${valueId}-${n}`}>
          <Stars />
          <span className="t-sr-only" id={`${valueId}-${n}`}>
            {outOf(n, stars.length)}
          </span>
        </Radio.Root>
      ))}
    </RadioGroup>
  );
}
