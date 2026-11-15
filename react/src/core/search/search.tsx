import { Input as Base } from "@base-ui/react/input";
import { clear, search } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import type spec from "@tailor/packs/core/search/spec";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { Glyph } from "../../glyph";
import { useIsStatic } from "../../kit";
import { useFieldControl } from "../field/field";

export interface SearchProps {
  /** The accessible name. */
  label: string;
  /** The text on every keystroke. Debouncing a request is the caller's job. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  /** The / key focuses the field while the focus is not in another field. */
  shortcut?: boolean;
  size?: (typeof spec.props.size)[number];
  name?: string;
  id?: string;
  disabled?: boolean;
}

/** True while the focus is in a place that takes text, where / is a character. */
const isTyping = (element: Element | null): boolean =>
  element instanceof HTMLTextAreaElement ||
  element instanceof HTMLSelectElement ||
  (element instanceof HTMLInputElement &&
    !["button", "checkbox", "radio", "range", "submit"].includes(element.type)) ||
  (element instanceof HTMLElement && element.isContentEditable);

/** A search field with a clear button, the / shortcut and Escape. */
export function Search({
  label,
  value,
  defaultValue,
  onValueChange,
  placeholder,
  shortcut = true,
  size = "md",
  name,
  id,
  disabled,
}: SearchProps) {
  const isStatic = useIsStatic();
  const field = useFieldControl({ id, name, disabled });
  const input = useRef<HTMLInputElement>(null);
  const [inner, setInner] = useState(defaultValue ?? "");
  const current = value ?? inner;
  const set = (next: string): void => {
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  };

  useEffect(() => {
    if (!shortcut || isStatic) return;
    const onKey = (event: globalThis.KeyboardEvent): void => {
      if (event.key !== "/" || event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey)
        return;
      if (isTyping(document.activeElement) || !input.current || input.current.disabled) return;
      event.preventDefault();
      input.current.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [shortcut, isStatic]);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    if (current) set("");
    else event.currentTarget.blur();
  };

  const props = {
    ...field,
    type: "search",
    className: "t-input-native",
    placeholder: placeholder || t("search"),
    "aria-label": label,
    autoComplete: "off",
  };
  const icon = (
    <span className="t-input-addon t-search-icon">
      <Glyph body={search} />
    </span>
  );
  const dataSize = size === "md" ? undefined : size;

  if (isStatic) {
    return (
      <div
        className="t-control t-input-group t-search"
        data-t="search"
        data-size={dataSize}
        data-shortcut={shortcut ? undefined : "off"}
      >
        {icon}
        <input {...props} defaultValue={current} />
      </div>
    );
  }

  return (
    <div className="t-control t-input-group t-search" data-size={dataSize}>
      {icon}
      <Base {...props} ref={input} value={current} onValueChange={set} onKeyDown={onKeyDown} />
      <button
        type="button"
        className="t-input-action t-search-clear"
        aria-label={t("clear")}
        disabled={field.disabled}
        onClick={() => {
          set("");
          input.current?.focus();
        }}
      >
        <Glyph body={clear} />
      </button>
      {shortcut ? (
        <span className="t-search-key" aria-hidden="true">
          /
        </span>
      ) : null}
    </div>
  );
}
