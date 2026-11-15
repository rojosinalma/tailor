import { Toolbar } from "@base-ui/react/toolbar";
import {
  formatBold,
  formatCode,
  formatHeading,
  formatItalic,
  formatLink,
  formatQuote,
  listBullet,
  listNumber,
} from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import {
  insertLink,
  type TextState,
  toggleCode,
  toggleLinePrefix,
  wrapSelection,
} from "@tailor/packs/markdown/markdown-editor/logic";
import type spec from "@tailor/packs/markdown/markdown-editor/spec";
import { type KeyboardEvent, useLayoutEffect, useRef, useState } from "react";
import { Tabs } from "../../core/tabs/tabs";
import { Glyph } from "../../glyph";
import { Markdown } from "../markdown/markdown";

/** The container breakpoint of the kit (authoring §5.7): below it, split mode falls back to tabs. */
const SPLIT_MIN_REM = 40;

type Edit = (state: TextState) => TextState;

const ACTIONS: readonly { id: string; glyph: string; label: () => string; key?: string; edit: Edit }[] = [
  {
    id: "bold",
    glyph: formatBold,
    label: () => t("mdBold"),
    key: "b",
    edit: (s) => wrapSelection(s, "**", "**", t("mdText")),
  },
  {
    id: "italic",
    glyph: formatItalic,
    label: () => t("mdItalic"),
    key: "i",
    edit: (s) => wrapSelection(s, "_", "_", t("mdText")),
  },
  {
    id: "link",
    glyph: formatLink,
    label: () => t("mdLink"),
    key: "k",
    edit: (s) => insertLink(s, t("mdText"), t("mdUrl")),
  },
  { id: "code", glyph: formatCode, label: () => t("mdCode"), edit: (s) => toggleCode(s, t("mdText")) },
  {
    id: "heading",
    glyph: formatHeading,
    label: () => t("mdHeading"),
    edit: (s) => toggleLinePrefix(s, "## "),
  },
  { id: "quote", glyph: formatQuote, label: () => t("mdQuote"), edit: (s) => toggleLinePrefix(s, "> ") },
  {
    id: "bullets",
    glyph: listBullet,
    label: () => t("mdBulletedList"),
    edit: (s) => toggleLinePrefix(s, "- "),
  },
  {
    id: "numbers",
    glyph: listNumber,
    label: () => t("mdNumberedList"),
    edit: (s) => toggleLinePrefix(s, "ordered"),
  },
];

export interface MarkdownEditorProps {
  /** The accessible name of the text area. */
  label: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** The field name in a form; the value goes with the form in every layout. */
  name?: string;
  /** Visible lines of the text area. */
  rows?: number;
  placeholder?: string;
  disabled?: boolean;
  /** "tabs": Write and Preview tabs. "split": side by side when the container is wide, tabs when it is narrow. */
  mode?: (typeof spec.props.mode)[number];
}

/** A Markdown text field with a formatting toolbar and a preview. */
export function MarkdownEditor({
  label,
  value,
  defaultValue = "",
  onValueChange,
  name,
  rows = 8,
  placeholder,
  disabled,
  mode = "tabs",
}: MarkdownEditorProps) {
  const [inner, setInner] = useState(defaultValue);
  const text = value ?? inner;
  const [tab, setTab] = useState("write");
  const [wide, setWide] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const pending = useRef<{ start: number; end: number } | null>(null);

  useLayoutEffect(() => {
    const element = root.current;
    if (mode !== "split" || !element) return;
    const observer = new ResizeObserver(([entry]) => {
      const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
      if (entry) setWide(entry.contentRect.width >= SPLIT_MIN_REM * rem);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [mode]);

  // After a toolbar edit, the text area gets the focus back with the selection the edit chose.
  useLayoutEffect(() => {
    const selection = pending.current;
    if (!selection || !area.current) return;
    pending.current = null;
    area.current.focus();
    area.current.setSelectionRange(selection.start, selection.end);
  });

  const change = (next: string): void => {
    setInner(next);
    onValueChange?.(next);
  };

  const apply = (edit: Edit): void => {
    const element = area.current;
    if (!element || disabled) return;
    const next = edit({ value: text, start: element.selectionStart, end: element.selectionEnd });
    pending.current = { start: next.start, end: next.end };
    change(next.value);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) return;
    const action = ACTIONS.find((a) => a.key === event.key.toLowerCase());
    if (!action) return;
    event.preventDefault();
    apply(action.edit);
  };

  const write = (
    <div className="t-md-editor-write">
      <Toolbar.Root className="t-md-editor-toolbar" aria-label={t("mdFormatting")} disabled={disabled}>
        {ACTIONS.map((action) => (
          <Toolbar.Button
            key={action.id}
            className="t-btn"
            data-variant="ghost"
            data-size="sm"
            data-icon-only=""
            aria-label={action.label()}
            onClick={() => apply(action.edit)}
          >
            <Glyph body={action.glyph} />
          </Toolbar.Button>
        ))}
      </Toolbar.Root>
      <textarea
        ref={area}
        className="t-control t-textarea"
        aria-label={label}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        value={text}
        onChange={(event) => change(event.target.value)}
        onKeyDown={onKeyDown}
      />
    </div>
  );
  const rendered = text.trim() ? (
    <Markdown source={text} />
  ) : (
    <p className="t-md-editor-empty">{t("mdNothingToPreview")}</p>
  );

  return (
    <div ref={root} className="t-md-editor" data-mode={mode === "tabs" ? undefined : mode}>
      {mode === "split" && wide ? (
        <div className="t-md-editor-split">
          {write}
          <section className="t-md-editor-preview" aria-label={t("mdPreview")}>
            {rendered}
          </section>
        </div>
      ) : (
        <Tabs
          label={label}
          value={tab}
          onValueChange={setTab}
          tabs={[
            { id: "write", label: t("mdWrite"), content: write },
            {
              id: "preview",
              label: t("mdPreview"),
              content: <div className="t-md-editor-preview">{rendered}</div>,
            },
          ]}
        />
      )}
      {name ? <input type="hidden" name={name} value={text} disabled={disabled} /> : null}
    </div>
  );
}
