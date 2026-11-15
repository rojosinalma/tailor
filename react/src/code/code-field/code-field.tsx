import { Field } from "@base-ui/react/field";
import { t } from "@tailor/core/text";
import { lineCount, rowsFor, tabEdit } from "@tailor/packs/code/code-field/logic";
import { highlightHtml, type Language } from "@tailor/packs/code/highlight/logic";
import { type KeyboardEvent, useId, useRef, useState } from "react";

export interface CodeFieldProps {
  /** "auto" guesses the language; "text" shows the code without colours. */
  language: Language;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  id?: string;
  /** The rows it shows at least. */
  rows?: number;
  /** The rows it grows to before it scrolls. */
  maxRows?: number;
  placeholder?: string;
  /** Numbers the lines in a gutter. */
  lineNumbers?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
  /** The accessible name, when no visible label names the field. */
  label?: string;
}

/**
 * A text area over a coloured copy of its text: the text area has transparent text and the same font
 * metrics, so the caret and the selection sit on the colours below.
 */
export function CodeField({
  language,
  value,
  defaultValue = "",
  onValueChange,
  name,
  id,
  rows = 3,
  maxRows = 12,
  placeholder,
  lineNumbers = false,
  disabled = false,
  readOnly = false,
  invalid = false,
  label,
}: CodeFieldProps) {
  const [inner, setInner] = useState(defaultValue);
  const text = value ?? inner;
  const hint = useId();
  const input = useRef<HTMLTextAreaElement>(null);
  const colour = useRef<HTMLPreElement>(null);
  const gutter = useRef<HTMLPreElement>(null);
  // After Escape, the next Tab leaves the field as usual.
  const escaped = useRef(false);

  const change = (next: string): void => {
    setInner(next);
    onValueChange?.(next);
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    const area = input.current;
    if (event.key === "Escape") {
      escaped.current = true;
      return;
    }
    const leave = escaped.current;
    escaped.current = false;
    if (event.key !== "Tab" || event.shiftKey || leave || readOnly || !area) return;
    event.preventDefault();
    const edit = tabEdit(area.value, area.selectionStart, area.selectionEnd);
    area.setRangeText(edit.text, edit.from, edit.to);
    area.setSelectionRange(edit.selectionStart, edit.selectionEnd);
    // The input event lets React and a form library see the new value.
    area.dispatchEvent(new Event("input", { bubbles: true }));
  };

  const onScroll = (): void => {
    const area = input.current;
    if (!area) return;
    for (const layer of [colour.current, gutter.current]) {
      if (layer) layer.scrollTop = area.scrollTop;
    }
    if (colour.current) colour.current.scrollLeft = area.scrollLeft;
  };

  const lines = lineCount(text);
  return (
    <div
      className="t-control t-code-field"
      data-line-numbers={lineNumbers ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      data-invalid={invalid ? "" : undefined}
    >
      {lineNumbers ? (
        <div className="t-code-field-gutter" aria-hidden="true">
          {/* The widest number sets the width; the numbers lie over the gutter and add no height. */}
          <span>{lines}</span>
          <pre className="t-code-field-numbers" ref={gutter}>
            {Array.from({ length: lines }, (_, i) => i + 1).join("\n")}
          </pre>
        </div>
      ) : null}
      <div className="t-code-field-editor">
        <pre
          className="t-code-field-colour"
          ref={colour}
          aria-hidden="true"
          aria-disabled={disabled || undefined}
        >
          <code
            // biome-ignore lint/security/noDangerouslySetInnerHtml: highlight.js escapes the code; its output holds only its own spans.
            dangerouslySetInnerHTML={{
              // The extra line break keeps a last empty line as tall as in the text area.
              __html: `${highlightHtml(text, disabled ? "text" : language)}\n`,
            }}
          />
        </pre>
        <Field.Control
          className="t-code-field-input"
          render={
            <textarea
              ref={input}
              rows={rowsFor(text, rows, maxRows)}
              wrap="off"
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
            />
          }
          value={text}
          onValueChange={change}
          onKeyDown={onKeyDown}
          onScroll={onScroll}
          name={name}
          id={id}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={invalid || undefined}
          aria-label={label}
          aria-describedby={readOnly ? undefined : hint}
        />
      </div>
      {readOnly ? null : (
        <span id={hint} className="t-sr-only">
          {t("codeFieldHint")}
        </span>
      )}
    </div>
  );
}
