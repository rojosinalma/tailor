import { NumberField as Base } from "@base-ui/react/number-field";
import { dash, plus } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import type spec from "@tailor/packs/core/number/spec";
import { Glyph } from "../../glyph";
import { useIsStatic } from "../../kit";
import { useFieldControl } from "../field/field";

export interface NumberFieldProps {
  value?: number | null;
  defaultValue?: number;
  onValueChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  name?: string;
  id?: string;
  size?: (typeof spec.props.size)[number];
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  /** A short suffix inside the box, such as "ms". */
  unit?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

/** A number with drawn step buttons. */
export function NumberField({
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  step = 1,
  name,
  id,
  size = "md",
  disabled,
  readOnly,
  required,
  unit,
  ...aria
}: NumberFieldProps) {
  const isStatic = useIsStatic();
  const field = useFieldControl({ id, name, disabled, required });
  const dataSize = size === "md" ? undefined : size;
  const describe = { "aria-invalid": field["aria-invalid"], "aria-describedby": field["aria-describedby"] };

  if (isStatic) {
    return (
      <input
        {...field}
        {...aria}
        type="number"
        className="t-control t-input"
        data-t="number"
        data-size={dataSize}
        data-unit={unit}
        defaultValue={value ?? defaultValue}
        min={min}
        max={max}
        step={step}
        readOnly={readOnly}
      />
    );
  }

  return (
    <Base.Root
      className="t-control t-number"
      data-size={dataSize}
      id={field.id}
      name={field.name}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange ? (next: number | null) => onValueChange(next) : undefined}
      min={min}
      max={max}
      step={step}
      format={{ useGrouping: false }}
      disabled={field.disabled}
      readOnly={readOnly}
      required={field.required}
    >
      <Base.Decrement className="t-number-step" aria-label={t("decrease")}>
        <Glyph body={dash} />
      </Base.Decrement>
      <Base.Input className="t-number-input" {...describe} {...aria} />
      {unit ? (
        <span className="t-number-unit" aria-hidden="true">
          {unit}
        </span>
      ) : null}
      <Base.Increment className="t-number-step" aria-label={t("increase")}>
        <Glyph body={plus} />
      </Base.Increment>
    </Base.Root>
  );
}
