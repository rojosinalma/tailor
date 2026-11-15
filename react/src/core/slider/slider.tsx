import { Slider as Base } from "@base-ui/react/slider";
import { type ReactNode, useId } from "react";
import { useIsStatic } from "../../kit";
import { useFieldControl } from "../field/field";

export interface SliderProps {
  /** The visible label. */
  label: ReactNode;
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Shows the value beside the label. */
  showValue?: boolean;
  name?: string;
  disabled?: boolean;
}

/** A value in a range, set by dragging or with the arrow keys. */
export function Slider({
  label,
  value,
  defaultValue,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  showValue,
  name,
  disabled,
}: SliderProps) {
  const isStatic = useIsStatic();
  const inputId = useId();
  // The slider carries its own label, so it takes only the name and the disabled state from a field.
  const field = useFieldControl({ name, disabled });

  if (isStatic) {
    const start = value ?? defaultValue ?? min;
    return (
      <div className="t-slider" data-t="slider">
        <div className="t-slider-header">
          <label className="t-slider-label" htmlFor={inputId}>
            {label}
          </label>
          {showValue ? (
            <output className="t-slider-value" htmlFor={inputId}>
              {start}
            </output>
          ) : null}
        </div>
        <input
          name={field.name}
          disabled={field.disabled}
          id={inputId}
          type="range"
          className="t-slider-native"
          min={min}
          max={max}
          step={step}
          defaultValue={start}
        />
      </div>
    );
  }

  return (
    <Base.Root
      className="t-slider"
      thumbAlignment="edge"
      value={value}
      defaultValue={defaultValue ?? (value === undefined ? min : undefined)}
      onValueChange={(next: number | readonly number[]) => {
        if (typeof next === "number") onValueChange?.(next);
      }}
      min={min}
      max={max}
      step={step}
      name={field.name}
      disabled={field.disabled}
    >
      <div className="t-slider-header">
        <Base.Label className="t-slider-label">{label}</Base.Label>
        {showValue ? <Base.Value className="t-slider-value" /> : null}
      </div>
      <Base.Control className="t-slider-control">
        <Base.Track className="t-slider-track">
          <Base.Indicator className="t-slider-fill" />
          <Base.Thumb className="t-slider-thumb" />
        </Base.Track>
      </Base.Control>
    </Base.Root>
  );
}
