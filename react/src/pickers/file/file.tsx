import { close, upload } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import { addFiles, formatSize, type Refusal, refusalText } from "@tailor/packs/pickers/file/logic";
import { type DragEvent, useRef, useState } from "react";
import { Glyph } from "../../glyph";
import { useIsStatic } from "../../kit";

export interface FilePickerProps {
  onFilesChange?: (files: File[]) => void;
  name?: string;
  /** The accessible name of the picker. */
  label: string;
  /** The accept attribute: extensions (".pdf"), MIME types or groups ("image/*"). */
  accept?: string;
  multiple?: boolean;
  /** The largest file in bytes. */
  maxSize?: number;
  /** The most files at once. */
  maxFiles?: number;
  /** A line under the button, e.g. "PDF, up to 10 MB". */
  hint?: string;
  disabled?: boolean;
  id?: string;
  "aria-describedby"?: string;
}

/** The texts of the error lines. */
export const refusalTexts = () => ({
  type: t("fileWrongType"),
  size: t("fileTooLarge"),
  count: t("fileTooMany"),
});

/** Puts files into a native file input, so that a form submit sends them. */
export function writeFiles(input: HTMLInputElement, files: readonly File[]): void {
  const transfer = new DataTransfer();
  for (const file of files) transfer.items.add(file);
  input.files = transfer.files;
}

/** Chooses files by a button or a drop; the native file input stays in the form as the value holder. */
export function FilePicker({
  onFilesChange,
  name,
  label,
  accept,
  multiple = false,
  maxSize,
  maxFiles,
  hint,
  disabled,
  id,
  "aria-describedby": describedBy,
}: FilePickerProps) {
  const isStatic = useIsStatic();
  const [files, setFiles] = useState<File[]>([]);
  const [refused, setRefused] = useState<Refusal[]>([]);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const rules = { accept, multiple, maxSize, maxFiles };

  if (isStatic) {
    return (
      <input
        type="file"
        className="t-control t-input"
        data-t="file"
        name={name}
        id={id}
        accept={accept}
        multiple={multiple}
        data-max-size={maxSize}
        data-max-files={maxFiles}
        data-hint={hint}
        aria-label={label}
        aria-describedby={describedBy}
        disabled={disabled}
      />
    );
  }

  const change = (next: File[]): void => {
    setFiles(next);
    if (input.current) writeFiles(input.current, next);
    onFilesChange?.(next);
  };
  const add = (added: readonly File[]): void => {
    const result = addFiles(files, added, rules);
    setRefused(result.refused);
    change(result.files);
  };
  const remove = (index: number): void => {
    const next = files.filter((_, i) => i !== index);
    setRefused([]);
    change(next);
    // The focus moves to the next remove button, or back to the choose button.
    requestAnimationFrame(() => {
      const buttons = root.current?.querySelectorAll<HTMLElement>(".t-file-remove");
      (
        buttons?.[Math.min(index, next.length - 1)] ?? root.current?.querySelector<HTMLElement>(".t-btn")
      )?.focus();
    });
  };
  const drop = {
    onDragOver: (event: DragEvent) => {
      if (disabled) return;
      event.preventDefault();
      setDragging(true);
    },
    onDragLeave: (event: DragEvent) => {
      if (!(event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)))
        setDragging(false);
    },
    onDrop: (event: DragEvent) => {
      event.preventDefault();
      setDragging(false);
      if (!disabled) add([...event.dataTransfer.files]);
    },
  };

  return (
    // biome-ignore lint/a11y/useSemanticElements: a fieldset would draw its own box around the drop zone.
    <div
      className="t-file"
      ref={root}
      role="group"
      aria-label={label}
      aria-describedby={describedBy}
      aria-disabled={disabled || undefined}
      data-dragging={dragging ? "" : undefined}
      {...drop}
    >
      <div className="t-file-zone">
        <span className="t-file-icon">
          <Glyph body={upload} />
        </span>
        <div className="t-file-text">
          <button
            type="button"
            className="t-btn"
            data-size="sm"
            id={id}
            disabled={disabled}
            onClick={() => input.current?.click()}
          >
            {t(multiple ? "fileChoose" : "fileChooseOne")}
          </button>
          <span className="t-file-hint">{t(multiple ? "fileDrop" : "fileDropOne")}</span>
          {hint ? <span className="t-file-hint">{hint}</span> : null}
        </div>
      </div>
      <input
        ref={input}
        type="file"
        hidden
        name={name}
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        tabIndex={-1}
        onChange={(event) => add([...(event.currentTarget.files ?? [])])}
      />
      {files.length ? (
        <ul className="t-file-list">
          {files.map((file, index) => (
            <li className="t-file-item" key={`${file.name}-${file.size}-${file.lastModified}`}>
              <span className="t-file-name">{file.name}</span>
              <span className="t-file-size">{formatSize(file.size)}</span>
              <button
                type="button"
                className="t-btn t-file-remove"
                data-variant="ghost"
                data-size="sm"
                data-icon-only=""
                aria-label={`${t("fileRemove")} ${file.name}`}
                disabled={disabled}
                onClick={() => remove(index)}
              >
                <Glyph body={close} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="t-file-errors" aria-live="polite">
        {refused.map((refusal) => (
          <p key={`${refusal.reason}-${refusal.name}`}>{refusalText(refusal, refusalTexts())}</p>
        ))}
      </div>
    </div>
  );
}
