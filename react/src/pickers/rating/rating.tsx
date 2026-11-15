import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { star, starFill } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import type spec from "@tailor/packs/pickers/rating/spec";
import { useId } from "react";
import { Glyph } from "../../glyph";
import { useIsStatic } from "../../kit";
import { useFieldGroup } from "../date/date";

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

const FOCUS = "[role=radio][data-checked]|input:checked|[role=radio]|input";

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
  const group = useFieldGroup(
    { id, name, disabled, required, "aria-describedby": describedBy },
    label,
    FOCUS,
  );
  const { field } = group;
  const named = {
    id: field.id,
    "aria-label": label,
    "aria-labelledby": label ? undefined : group.labelledBy,
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
        aria-labelledby={label || !group.labelledBy ? undefined : `${group.labelledBy} ${valueId}`}
        data-t={isStatic ? "rating" : undefined}
        data-value-id={isStatic ? valueId : undefined}
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
        data-t="rating"
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
      ref={group.ref}
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
