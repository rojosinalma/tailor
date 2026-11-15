import { Input as Base } from "@base-ui/react/input";
import { check, copy, eye, eyeSlash } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import type spec from "@tailor/packs/core/secret/spec";
import { useEffect, useRef, useState } from "react";
import { Glyph } from "../../glyph";
import { useIsStatic } from "../../kit";
import { useFieldControl } from "../field/field";

const COPIED_FOR = 2000;

export interface SecretProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Adds a button that copies the value. */
  copyable?: boolean;
  autoComplete?: "off" | "current-password" | "new-password";
  placeholder?: string;
  size?: (typeof spec.props.size)[number];
  name?: string;
  id?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

/** A secret value with a reveal button and an optional copy button. */
export function Secret({
  value,
  defaultValue,
  onValueChange,
  copyable,
  autoComplete = "off",
  placeholder,
  size = "md",
  name,
  id,
  disabled,
  readOnly,
  required,
  ...aria
}: SecretProps) {
  const isStatic = useIsStatic();
  const field = useFieldControl({ id, name, disabled, required });
  const input = useRef<HTMLInputElement>(null);
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);
  const dataSize = size === "md" ? undefined : size;

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), COPIED_FOR);
    return () => clearTimeout(timer);
  }, [copied]);

  const props = {
    ...field,
    ...aria,
    className: "t-input-native",
    placeholder,
    autoComplete,
    readOnly,
    spellCheck: false,
  };

  if (isStatic) {
    return (
      <div
        className="t-control t-input-group t-secret"
        data-t="secret"
        data-size={dataSize}
        data-invalid={field["aria-invalid"] ? "" : undefined}
        data-disabled={field.disabled ? "" : undefined}
        data-copyable={copyable ? "" : undefined}
      >
        <input {...props} type="password" defaultValue={value ?? defaultValue} />
      </div>
    );
  }

  return (
    <div
      className="t-control t-input-group t-secret"
      data-size={dataSize}
      data-invalid={field["aria-invalid"] ? "" : undefined}
      data-disabled={field.disabled ? "" : undefined}
    >
      <Base
        {...props}
        ref={input}
        type={shown ? "text" : "password"}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange ? (next: string) => onValueChange(next) : undefined}
      />
      <button
        type="button"
        className="t-input-action t-secret-reveal"
        aria-label={t("show")}
        aria-pressed={shown}
        disabled={field.disabled}
        onClick={() => setShown(!shown)}
      >
        <Glyph body={shown ? eyeSlash : eye} />
      </button>
      {copyable ? (
        <button
          type="button"
          className="t-input-action t-secret-copy"
          aria-label={copied ? t("copied") : t("copy")}
          data-copied={copied ? "" : undefined}
          disabled={field.disabled}
          onClick={() => {
            navigator.clipboard.writeText(input.current?.value ?? "").then(
              () => setCopied(true),
              () => setCopied(false),
            );
          }}
        >
          <Glyph body={copied ? check : copy} />
        </button>
      ) : null}
    </div>
  );
}
