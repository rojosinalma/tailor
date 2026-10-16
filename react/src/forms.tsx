// Forms: field, check, duration-input, settings-row — markup per
// core/components.json; settings autosave and duration logic reimplemented in
// React (tailor.js is not loaded).
import {
  cloneElement, isValidElement, useId, useRef, useState,
  type FieldsetHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes,
  type LabelHTMLAttributes, type ReactElement, type ReactNode,
  type SelectHTMLAttributes, type TextareaHTMLAttributes,
} from "react";
import { cx, dataAttr } from "./util.ts";
import { Help, type HelpProps } from "./feedback.tsx";

/* ── field parts ─────────────────────────────────────────────────────────── */

export function Label({ className, children, ...rest }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cx("t-label", className)} {...rest}>{children}</label>;
}

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & { size?: "sm" | "md" };

export function Input({ size, className, ...rest }: InputProps) {
  return <input className={cx("t-input", className)} data-size={dataAttr(size, "md")} {...rest} />;
}

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & { size?: "sm" | "md" };

export function Select({ size, className, children, ...rest }: SelectProps) {
  return <select className={cx("t-select", className)} data-size={dataAttr(size, "md")} {...rest}>{children}</select>;
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx("t-textarea", className)} {...rest} />;
}

export function InputGroup({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("t-input-group", className)} {...rest}>{children}</div>;
}

export function InputAddon({ className, children, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cx("t-input-addon", className)} {...rest}>{children}</span>;
}

/* ── field ───────────────────────────────────────────────────────────────── */

export type FieldProps = HTMLAttributes<HTMLDivElement> & {
  label: ReactNode;
  /** Control id; set on the control child and the label's `for`. */
  id?: string;
  /** Caption under the control (`.t-hint`). */
  hint?: ReactNode;
  /** Validation error: renders `.t-feedback[data-tone=danger]` and marks the control `aria-invalid`. */
  error?: ReactNode;
  /** Success feedback (`.t-feedback[data-tone=success]`). */
  success?: ReactNode;
  children: ReactNode;
};

/**
 * `<Ui.Field label hint error>` — wraps one control (Ui.Input/Select/Textarea
 * or an InputGroup). When the single child is an element, Field injects `id`
 * and, on error, `aria-invalid` + `aria-describedby` pointing at the feedback.
 */
export function Field({ label, id, hint, error, success, className, children, ...rest }: FieldProps) {
  const autoId = useId();
  const controlId = id ?? autoId;
  const feedbackId = `${controlId}-fb`;
  let control = children;
  if (isValidElement(children)) {
    const child = children as ReactElement<Record<string, unknown>>;
    // Only bare controls get the id/aria injection; wrappers (InputGroup…)
    // carry their own ids on the inner control.
    const injectable = child.type === Input || child.type === Select || child.type === Textarea;
    if (injectable) {
      const extra: Record<string, unknown> = { id: child.props.id ?? controlId };
      if (error) {
        extra["aria-invalid"] = "true";
        extra["aria-describedby"] = child.props["aria-describedby"] ?? feedbackId;
      }
      control = cloneElement(child, extra);
    }
  }
  return (
    <div className={cx("t-field", className)} {...rest}>
      <Label htmlFor={controlId}>{label}</Label>
      {control}
      {hint !== undefined && <p className="t-hint">{hint}</p>}
      {error !== undefined && <p className="t-feedback" id={feedbackId} data-tone="danger">{error}</p>}
      {success !== undefined && <p className="t-feedback" data-tone="success">{success}</p>}
    </div>
  );
}

/* ── check (checkbox, radio, switch) ─────────────────────────────────────── */

export type CheckProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  type?: "checkbox" | "radio";
  /** Switch appearance + `role="switch"`. */
  switch?: boolean;
  label: ReactNode;
  desc?: ReactNode;
};

export function Check({ type = "checkbox", switch: isSwitch, label, desc, className, ...rest }: CheckProps) {
  return (
    <label className={cx("t-check", className)} data-variant={isSwitch ? "switch" : undefined}>
      <input className="t-check-input" type={type} role={isSwitch ? "switch" : undefined} {...rest} />
      <span className="t-check-label">
        {label}
        {desc !== undefined && <span className="t-check-desc">{desc}</span>}
      </span>
    </label>
  );
}

type CheckGroupProps = FieldsetHTMLAttributes<HTMLFieldSetElement> & { legend: ReactNode };

export function CheckGroup({ legend, className, children, ...rest }: CheckGroupProps) {
  return (
    <fieldset className={cx("t-check-group", className)} {...rest}>
      <legend className="t-label">{legend}</legend>
      {children}
    </fieldset>
  );
}

Check.Group = CheckGroup;

/* ── duration input ──────────────────────────────────────────────────────── */

const UNITS = [
  { factor: 1, label: "s" },
  { factor: 60, label: "min" },
  { factor: 3600, label: "h" },
] as const;

export type DurationInputProps = Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> & {
  /** `data-setting` key for settings-row autosave. */
  setting?: string;
  /** Value in seconds. */
  value?: number;
  onChange?: (seconds: number) => void;
  id?: string;
  label?: string;
  size?: "sm" | "md";
};

/** Number + unit pair editing a seconds value (`.t-input-group.t-duration`). */
export function DurationInput({ setting, value, onChange, id, label, size, className, ...rest }: DurationInputProps) {
  const initialUnit = value !== undefined
    ? [...UNITS].reverse().find((u) => value > 0 && value % u.factor === 0)?.factor ?? 1
    : 1;
  const [unit, setUnit] = useState<number>(initialUnit);
  const numRef = useRef<HTMLInputElement>(null);
  const emit = (n: number, f: number) => onChange?.(Math.max(0, Math.round(n * f)));
  return (
    <div
      className={cx("t-input-group", "t-duration", className)}
      data-setting={setting}
      data-value={value !== undefined ? String(value) : undefined}
      {...rest}
    >
      <input
        ref={numRef}
        className="t-input"
        type="number"
        min="0"
        step="1"
        id={id}
        aria-label={label}
        data-size={dataAttr(size, "md")}
        {...(value !== undefined ? { value: value / unit, onChange: (e) => emit(Number(e.target.value), unit) } : {})}
      />
      <select
        className="t-select"
        aria-label="unit"
        data-size={dataAttr(size, "md")}
        {...(value !== undefined
          ? {
              value: String(unit),
              onChange: (e) => {
                const f = Number(e.target.value);
                setUnit(f);
                emit(Number(numRef.current?.value ?? 0), f);
              },
            }
          : {})}
      >
        {UNITS.map((u) => <option key={u.factor} value={String(u.factor)}>{u.label}</option>)}
      </select>
    </div>
  );
}

/* ── settings row ────────────────────────────────────────────────────────── */

export function Settings({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("t-settings", className)} {...rest}>{children}</div>;
}

export type SaveResult = { ok: boolean; message?: string };

export type SettingsRowProps = Omit<HTMLAttributes<HTMLDivElement>, "onChange"> & {
  /** Row label; `htmlFor` should match the control's id. */
  label: ReactNode;
  htmlFor?: string;
  /** Optional help popover next to the label. */
  help?: HelpProps;
  /** The setting key; injected as `data-setting` on the control child. */
  setting?: string;
  /** Autosave callback, called with (key, value) on the control's change event. */
  save?: (key: string, value: string) => Promise<SaveResult>;
  children: ReactNode;
};

/**
 * One settings row (`.t-setting`): label cell, control cell, live state cell.
 * With `save`, any `change` event bubbling from the control cell triggers
 * `data-state="saving|saved|failed"` and the state-cell message — the React
 * reimplementation of Tailor.settingsAutoSave.
 */
export function SettingsRow({
  label, htmlFor, help, setting, save, className, children, ...rest
}: SettingsRowProps) {
  const [state, setState] = useState<"" | "saving" | "saved" | "failed">("");
  const [message, setMessage] = useState("");

  let control = children;
  if (setting !== undefined && isValidElement(children)) {
    const child = children as ReactElement<Record<string, unknown>>;
    control = cloneElement(child, { "data-setting": setting });
  }

  const onCellChange = save && setting
    ? (e: { target: EventTarget }) => {
        const t = e.target as HTMLInputElement;
        const value = t.type === "checkbox" ? String(t.checked) : t.value;
        setState("saving");
        setMessage("");
        save(setting, value).then(
          (res) => { setState(res.ok ? "saved" : "failed"); setMessage(res.message ?? ""); },
          () => { setState("failed"); setMessage("Save failed"); },
        );
      }
    : undefined;

  return (
    <div className={cx("t-setting", className)} data-state={state || undefined} {...rest}>
      <div className="t-setting-label">
        <label htmlFor={htmlFor}>{label}</label>
        {help && <Help {...help} />}
      </div>
      <div className="t-setting-control" onChange={onCellChange}>{control}</div>
      <span className="t-setting-state" aria-live="polite">{message}</span>
    </div>
  );
}

Settings.Row = SettingsRow;
