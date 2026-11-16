import { type CSSProperties, type ReactNode, useId, useState } from "react";
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

/**
 * A value in a range, set by dragging or with the arrow keys. Both kits draw a native range input: the browser
 * gives the keys, the pointer and the hit area, and the two kits draw the same pixels.
 */
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
  const [inner, setInner] = useState(defaultValue ?? min);
  const current = value ?? inner;
  // The track paints the fill from this fraction; the HTML kit's script sets the same.
  const fill = { "--t-slider-value": max > min ? (current - min) / (max - min) : 0 } as CSSProperties;
  const native = {
    name: field.name,
    disabled: field.disabled,
    id: inputId,
    type: "range",
    className: "t-slider-native",
    min,
    max,
    step,
  };

  return (
    <div className="t-slider" data-t={isStatic ? "slider" : undefined} style={fill}>
      <div className="t-slider-header">
        <label className="t-slider-label" htmlFor={inputId}>
          {label}
        </label>
        {showValue ? (
          <output className="t-slider-value" htmlFor={inputId}>
            {current}
          </output>
        ) : null}
      </div>
      {isStatic ? (
        <input {...native} defaultValue={current} />
      ) : (
        <input
          {...native}
          value={current}
          onChange={(event) => {
            const next = event.currentTarget.valueAsNumber;
            setInner(next);
            onValueChange?.(next);
          }}
        />
      )}
    </div>
  );
}
