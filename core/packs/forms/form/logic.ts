/** The rules that both kits share: the message of a failed check and the shape of a submit result. */
import { t } from "@tailor/core/text";

/** What the server or onSubmit answers. `errors` maps field names to their messages. */
export interface SubmitResult {
  readonly ok: boolean;
  readonly message?: string;
  readonly errors?: Readonly<Record<string, string>>;
}

/** The parts of a ValidityState that pick the message. */
export interface ValidityLike {
  readonly valueMissing: boolean;
  readonly typeMismatch: boolean;
  readonly badInput: boolean;
  readonly patternMismatch: boolean;
  readonly rangeUnderflow: boolean;
  readonly rangeOverflow: boolean;
  readonly tooShort: boolean;
  readonly tooLong: boolean;
  readonly stepMismatch: boolean;
}

/** One failed check. The name is also the suffix of the attribute that replaces its message. */
export type Problem = "required" | "type" | "pattern" | "min" | "max" | "minlength" | "maxlength" | "step";

/** The first failed check, in the order a person fixes them; null when the value is valid. */
export function problemOf(validity: ValidityLike): Problem | null {
  if (validity.valueMissing) return "required";
  if (validity.typeMismatch || validity.badInput) return "type";
  if (validity.tooShort) return "minlength";
  if (validity.tooLong) return "maxlength";
  if (validity.rangeUnderflow) return "min";
  if (validity.rangeOverflow) return "max";
  if (validity.patternMismatch) return "pattern";
  if (validity.stepMismatch) return "step";
  return null;
}

/** The limits of the control that the messages name. */
export interface Limits {
  readonly type?: string;
  readonly min?: string;
  readonly max?: string;
  readonly minLength?: number;
  readonly maxLength?: number;
}

const TYPE_TEXT = { email: "errorEmail", url: "errorUrl", number: "errorNumber" } as const;
const isTyped = (type: string | undefined): type is keyof typeof TYPE_TEXT =>
  type === "email" || type === "url" || type === "number";

/** The message of a failed check, from the built-in texts. */
export function messageFor(problem: Problem, limits: Limits = {}): string {
  switch (problem) {
    case "required":
      return t("errorRequired");
    case "type":
      return t(isTyped(limits.type) ? TYPE_TEXT[limits.type] : "invalid");
    case "pattern":
      return t("errorPattern");
    case "min":
      return t("errorMin").replace("{min}", limits.min ?? "");
    case "max":
      return t("errorMax").replace("{max}", limits.max ?? "");
    case "minlength":
      return t("errorMinLength").replace("{min}", String(limits.minLength ?? ""));
    case "maxlength":
      return t("errorMaxLength").replace("{max}", String(limits.maxLength ?? ""));
    case "step":
      return t("invalid");
  }
}

/** True for a value that a required field cannot have. */
export const isEmpty = (value: unknown): boolean =>
  value === undefined ||
  value === null ||
  value === false ||
  (typeof value === "string" && value.trim() === "") ||
  (Array.isArray(value) && value.length === 0);

/** A submit result read from a server answer; anything else is a failure with no message. */
export function readResult(data: unknown): SubmitResult {
  if (typeof data !== "object" || data === null || !("ok" in data)) return { ok: false };
  const message = "message" in data && typeof data.message === "string" ? data.message : undefined;
  const errors: Record<string, string> = {};
  if ("errors" in data && typeof data.errors === "object" && data.errors !== null)
    for (const [name, text] of Object.entries(data.errors)) if (typeof text === "string") errors[name] = text;
  return {
    ok: data.ok === true,
    message,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
}
