import { t } from "@tailor/core/text";
import { isEmpty, messageFor, problemOf, type SubmitResult } from "@tailor/packs/forms/form/logic";
import type spec from "@tailor/packs/forms/form/spec";
import {
  type DeepKeys,
  defaultValidationLogic,
  type ReactFormExtendedApi,
  useField,
  useForm,
  useStore,
  type ValidationLogicFn,
} from "@tanstack/react-form";
import {
  type FocusEvent,
  type FormEvent,
  type ReactNode,
  type RefObject,
  useId,
  useRef,
  useState,
} from "react";
import { Alert } from "../../core/alert/alert";
import { Button } from "../../core/button/button";
import { Field } from "../../core/field/field";
import { useToast } from "../../core/toast/toast";
import { useIsStatic } from "../../kit";

export type { SubmitResult };

type Values = Record<string, unknown>;

/** The TanStack form behind a tailor form. `form.state.isDirty` tells about unsaved changes. */
export type TailorForm<V extends object> = ReactFormExtendedApi<
  V,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  never
>;

export interface TailorFormOptions<V extends object> {
  defaultValues: V;
  /** The check of each field: the error text, or undefined when the value is valid. */
  validators?: { readonly [K in keyof V]?: (value: V[K], values: V) => string | undefined };
  /** Sends the values. Return the outcome, or throw: the form shows it as a toast and puts `errors` on fields. */
  onSubmit: (values: V) => SubmitResult | Promise<SubmitResult>;
}

interface FieldInfo {
  readonly label: ReactNode;
  readonly id: string;
}

/** What the tailor parts share about one form, next to the TanStack form. */
interface Extra {
  readonly validators: Readonly<
    Record<string, ((value: never, values: never) => string | undefined) | undefined>
  >;
  readonly element: RefObject<HTMLFormElement | null>;
  /** The fields in the order they render, which is the order on the page. */
  readonly fields: Map<string, FieldInfo>;
  failed: boolean;
}

const extras = new WeakMap<object, Extra>();
const extraOf = (form: object): Extra => {
  const extra = extras.get(form);
  if (!extra) throw new Error("tailor: pass a form from useTailorForm");
  return extra;
};

/** The TanStack form typed loosely, for the parts that address fields by a name string. */
type LooseForm = TailorForm<Values>;
const loose = (form: object): LooseForm => form as LooseForm;

/**
 * A field checks on blur and on submit. Once it shows an error, it checks on each change, so that the
 * error clears while the person fixes the value.
 */
const tailorLogic: ValidationLogicFn = (props) => {
  const name = props.event.fieldName;
  const shown = name ? (props.form.getFieldMeta(name)?.errors.length ?? 0) > 0 : false;
  const run =
    props.event.type === "blur" || props.event.type === "submit" || (props.event.type === "change" && shown);
  // TanStack reads the list of validators from the return value, though the type says void.
  return defaultValidationLogic({
    ...props,
    runValidation: ({ validators, form }) => {
      const dynamic = props.event.async ? props.validators?.onDynamicAsync : props.validators?.onDynamic;
      return props.runValidation({
        validators: run && dynamic ? [...validators, { fn: dynamic, cause: "dynamic" }] : validators,
        form,
      });
    },
  });
};

const FOCUSABLE =
  'input:not([type="hidden"]):not([aria-hidden="true"]), select:not([aria-hidden="true"]), textarea:not([aria-hidden="true"]), button:not([tabindex="-1"]), [tabindex="0"]';

function focusFirstInvalid(form: object): void {
  const api = loose(form);
  for (const [name, info] of extraOf(form).fields) {
    if ((api.getFieldMeta(name)?.errors.length ?? 0) === 0) continue;
    document.getElementById(info.id)?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    return;
  }
}

/** A form on TanStack Form with tailor's checks, toasts and server errors. */
export function useTailorForm<V extends object>(options: TailorFormOptions<V>): TailorForm<V> {
  const toast = useToast();
  const element = useRef<HTMLFormElement>(null);
  const [failed, setFailed] = useState(false);
  const fail = (): void => {
    setFailed(true);
    focusFirstInvalid(form);
  };
  const form: TailorForm<V> = useForm({
    defaultValues: options.defaultValues,
    validationLogic: tailorLogic,
    onSubmitInvalid: () => fail(),
    onSubmit: async ({ value }) => {
      let result: SubmitResult;
      try {
        result = await options.onSubmit(value);
      } catch (error) {
        result = { ok: false, message: error instanceof Error ? error.message : undefined };
      }
      if (result.ok) {
        setFailed(false);
        toast("success", result.message ?? t("formSaved"));
        return;
      }
      toast("danger", result.message ?? t("formFailed"));
      const api = loose(form);
      for (const [name, message] of Object.entries(result.errors ?? {}))
        api.setFieldMeta(name, (meta) => ({ ...meta, errorMap: { ...meta.errorMap, onServer: message } }));
      fail();
    },
  });
  const known = extras.get(form);
  if (known) known.failed = failed;
  else
    extras.set(form, {
      validators: options.validators ?? {},
      element,
      fields: new Map(),
      failed,
    });
  return form;
}

export interface FormProps<V extends object> {
  form: TailorForm<V>;
  /** "stack": one column. "grid": two columns in a wide container, one in a narrow one. */
  layout?: (typeof spec.props.layout)[number];
  /** The address that the HTML kit sends the form to with fetch. The React kit calls onSubmit. */
  action?: string;
  /** The accessible name of the form. */
  label?: string;
  children: ReactNode;
}

/** The <form>. It never reloads the page and shows no browser bubbles. */
export function Form<V extends object>({ form, layout = "stack", action, label, children }: FormProps<V>) {
  const isStatic = useIsStatic();
  const { element } = extraOf(form);
  const dataLayout = layout === "stack" ? undefined : layout;
  if (isStatic) {
    return (
      <form
        className="t-form"
        data-t="form"
        data-layout={dataLayout}
        noValidate
        aria-label={label}
        action={action}
        method={action ? "post" : undefined}
        data-t-submit={action ? "fetch" : undefined}
      >
        {children}
      </form>
    );
  }
  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    void form.handleSubmit();
  };
  return (
    <form
      ref={element}
      className="t-form"
      data-layout={dataLayout}
      noValidate
      aria-label={label}
      onSubmit={submit}
    >
      {children}
    </form>
  );
}

/** What a FormField hands to a control that shows a value: Input, Select, NumberField, DatePicker, … */
export interface ValueControl<T> {
  name: string;
  value: T;
  onValueChange: (value: T) => void;
}

/** What a FormField of kind "toggle" hands to a Switch or a Check, which carry the label. */
export interface ToggleControl {
  name: string;
  label: ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

/** What a FormField of kind "group" hands to a control with its own legend: RadioGroup, CheckGroup, Slider. */
export interface GroupControl<T> extends ValueControl<T> {
  label: ReactNode;
}

type Kind = "field" | "toggle" | "group";
type ControlOf<T, K extends Kind> = K extends "toggle"
  ? [T] extends [boolean]
    ? ToggleControl
    : never
  : K extends "group"
    ? GroupControl<T>
    : ValueControl<T>;

export interface FormFieldProps<V extends object, N extends keyof V & string, K extends Kind> {
  form: TailorForm<V>;
  name: N;
  label: ReactNode;
  help?: ReactNode;
  required?: boolean;
  /**
   * "field" (default): the label sits above the control. "toggle": a Switch or Check that carries the label,
   * for a true/false value. "group": a control with its own legend, such as a RadioGroup or CheckGroup.
   */
  kind?: K;
  /** Full width in the grid layout. */
  span?: boolean;
  /** Renders the control with the props it needs: `{(control) => <Input {...control} />}`. */
  children: (control: ControlOf<V[N], K>) => ReactNode;
}

/**
 * True when the focus leaves the field. A move inside it or into its popup does not count, nor a press on a
 * submit button: the submit checks anyway, and an error drawn now would move the button away from the click.
 */
function leaves(field: Element, to: EventTarget | null): boolean {
  if (!(to instanceof Element)) return true;
  if (field.contains(to) || to.closest(".t-popup-positioner")) return false;
  return !(to instanceof HTMLButtonElement && to.type === "submit" && to.matches(":active"));
}

/** The message of the first native check that a control in the field fails: type, length, range. */
function nativeProblem(id: string): string | undefined {
  const controls = document.getElementById(id)?.querySelectorAll("input, select, textarea") ?? [];
  for (const control of controls) {
    if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement)) continue;
    const problem = control.willValidate ? problemOf(control.validity) : null;
    if (problem && problem !== "required")
      return messageFor(problem, {
        type: control.type,
        min: "min" in control ? control.min : undefined,
        max: "max" in control ? control.max : undefined,
        minLength: control.minLength,
        maxLength: control.maxLength,
      });
  }
  return undefined;
}

/** One field of a tailor form: the control, its label, its help and its first error. */
export function FormField<V extends object, N extends keyof V & string, K extends Kind = "field">({
  form,
  name,
  label,
  help,
  required,
  kind,
  span,
  children,
}: FormFieldProps<V, N, K>) {
  const id = useId();
  const extra = extraOf(form);
  extra.fields.set(name, { label, id });
  const check = extra.validators[name] as ((value: V[N], values: V) => string | undefined) | undefined;
  const field = useField({
    form: loose(form),
    name: name as DeepKeys<Values>,
    validators: {
      onDynamic: ({ value }: { value: unknown }) => {
        if (required && isEmpty(value)) return t("errorRequired");
        return nativeProblem(id) ?? check?.(value as V[N], form.state.values);
      },
    },
  });
  const value = field.state.value as V[N];
  const errors = field.state.meta.errors;
  const error = typeof errors[0] === "string" ? errors[0] : undefined;
  const set = (next: unknown): void => field.handleChange(next);

  const blur = (event: FocusEvent<HTMLDivElement>): void => {
    if (leaves(event.currentTarget, event.relatedTarget)) field.handleBlur();
  };

  const control = (kind === "toggle"
    ? { name, label, checked: value === true, onCheckedChange: set }
    : kind === "group"
      ? { name, label, value, onValueChange: set }
      : { name, value, onValueChange: set }) as unknown as ControlOf<V[N], K>;

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: the controls take no onBlur, so the field hears the blur of any control in it.
    <div
      className="t-form-field"
      id={id}
      data-span={span ? "" : undefined}
      data-invalid={error ? "" : undefined}
      onBlur={blur}
    >
      {kind === "toggle" || kind === "group" ? (
        <div className="t-field" data-invalid={error ? "" : undefined}>
          {children(control)}
          {help ? <p className="t-field-help">{help}</p> : null}
          <p className="t-field-error" aria-live="polite">
            {error}
          </p>
        </div>
      ) : (
        <Field label={label} help={help} error={error} required={required}>
          {children(control)}
        </Field>
      )}
    </div>
  );
}

export interface FormSectionProps {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}

/** A group of fields with a title. */
export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <fieldset className="t-form-section">
      <legend className="t-form-section-title">{title}</legend>
      {description ? <p className="t-form-section-description">{description}</p> : null}
      <div className="t-form-section-body">{children}</div>
    </fieldset>
  );
}

/** After a failed submit: a danger alert at the top with a link to each invalid field. */
export function FormSummary<V extends object>({ form }: { form: TailorForm<V> }) {
  const isStatic = useIsStatic();
  const extra = extraOf(form);
  const metas = useStore(form.store, (state) => state.fieldMeta);
  if (isStatic) return <div className="t-form-summary" hidden />;
  const items: { name: string; info: FieldInfo; message: string }[] = [];
  for (const [name, info] of extra.fields) {
    const message = (metas as Record<string, { errors?: unknown[] } | undefined>)[name]?.errors?.[0];
    if (typeof message === "string") items.push({ name, info, message });
  }
  if (!extra.failed || items.length === 0) return <div className="t-form-summary" hidden />;
  return (
    <div className="t-form-summary">
      <Alert tone="danger" title={t("formSummary")}>
        <ul className="t-form-summary-list">
          {items.map(({ name, info, message }) => (
            <li key={name}>
              <a
                href={`#${info.id}`}
                onClick={(event) => {
                  event.preventDefault();
                  document.getElementById(info.id)?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
                }}
              >
                {info.label}: {message}
              </a>
            </li>
          ))}
        </ul>
      </Alert>
    </div>
  );
}

export interface FormActionsProps<V extends object> {
  form: TailorForm<V>;
  /** The text of the submit button, the only primary button: "Add host", "Save". */
  submit: string;
  /** Secondary buttons before it, such as Cancel or Reset. */
  children?: ReactNode;
}

/** The row of buttons at the end of the form. The submit button shows a spinner while the form sends. */
export function FormActions<V extends object>({ form, submit, children }: FormActionsProps<V>) {
  const sending = useStore(form.store, (state) => state.isSubmitting);
  return (
    <div className="t-form-actions">
      {children}
      <Button type="submit" variant="primary" loading={sending}>
        {submit}
      </Button>
    </div>
  );
}
