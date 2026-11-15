import { Field as Base } from "@base-ui/react/field";
import { danger } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import type spec from "@tailor/packs/core/field/spec";
import { createContext, type MouseEvent, type ReactNode, use, useId } from "react";
import { Glyph } from "../../glyph";
import { useIsStatic } from "../../kit";

/** What a field hands to its control: the label wiring, the messages and the shared states. */
export interface FieldControlProps {
  id?: string;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
}

const FieldContext = createContext<FieldControlProps>({});

/**
 * The props that a control takes from the field around it, merged with its own. Every tailor control that is
 * not a Base UI field control reads them, and so does every control in static mode. Outside a field it
 * returns the control's own props.
 */
export function useFieldControl(own: FieldControlProps = {}): FieldControlProps {
  const field = use(FieldContext);
  const describedBy = [own["aria-describedby"], field["aria-describedby"]].filter(Boolean).join(" ");
  return {
    id: own.id ?? field.id,
    name: own.name ?? field.name,
    disabled: own.disabled || field.disabled || undefined,
    required: own.required || field.required || undefined,
    "aria-invalid": own["aria-invalid"] ?? field["aria-invalid"],
    "aria-describedby": describedBy || undefined,
  };
}

export interface FieldProps {
  label: ReactNode;
  /** A short hint under the control. */
  help?: ReactNode;
  /** Marks the field invalid and shows the text. No error: the field is valid. */
  error?: string;
  required?: boolean;
  disabled?: boolean;
  /** "horizontal": the label beside the control; a narrow field stacks them. */
  orientation?: (typeof spec.props.orientation)[number];
  /** The form name of the control. */
  name?: string;
  /** One control. */
  children: ReactNode;
}

// A label for a button control (a select or picker trigger) focuses it instead of pressing it.
const focusButton = (event: MouseEvent<HTMLLabelElement>): void => {
  const control = event.currentTarget.htmlFor ? document.getElementById(event.currentTarget.htmlFor) : null;
  if (control instanceof HTMLButtonElement) {
    event.preventDefault();
    control.focus();
  }
};

export function Field({
  label,
  help,
  error,
  required,
  disabled,
  orientation = "vertical",
  name,
  children,
}: FieldProps) {
  const isStatic = useIsStatic();
  const id = useId();
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const control: FieldControlProps = {
    id,
    name,
    disabled,
    required,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": [help ? helpId : "", error ? errorId : ""].filter(Boolean).join(" ") || undefined,
  };
  const dataOrientation = orientation === "vertical" ? undefined : orientation;

  const labelContent = (
    <>
      {label}
      {required ? (
        <span className="t-field-required" aria-hidden="true">
          {t("required")}
        </span>
      ) : null}
    </>
  );
  const slot = (
    <div className="t-field-control">
      <FieldContext value={control}>{children}</FieldContext>
    </div>
  );
  const errorText = (
    <p className="t-field-error" id={errorId} aria-live="polite">
      {error ? (
        <>
          <Glyph body={danger} />
          <span>{error}</span>
        </>
      ) : null}
    </p>
  );

  if (isStatic) {
    return (
      <div
        className="t-field"
        data-orientation={dataOrientation}
        data-invalid={error ? "" : undefined}
        data-disabled={disabled ? "" : undefined}
      >
        <label className="t-field-label" htmlFor={id}>
          {labelContent}
        </label>
        {slot}
        {help ? (
          <p className="t-field-help" id={helpId}>
            {help}
          </p>
        ) : null}
        {errorText}
      </div>
    );
  }

  return (
    <Base.Root
      className="t-field"
      data-orientation={dataOrientation}
      invalid={error ? true : undefined}
      disabled={disabled}
      name={name}
    >
      <Base.Label className="t-field-label" htmlFor={id} onClick={focusButton}>
        {labelContent}
      </Base.Label>
      {slot}
      {help ? (
        <Base.Description className="t-field-help" id={helpId}>
          {help}
        </Base.Description>
      ) : null}
      {errorText}
    </Base.Root>
  );
}
