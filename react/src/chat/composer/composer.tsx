import { chatAttach, chatSend, chatStop } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import { accepts, canSend, sendsOnKey, showsCount } from "@tailor/packs/chat/composer/logic";
import {
  type ClipboardEvent,
  type DragEvent,
  type KeyboardEvent,
  type ReactNode,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Button } from "../../core/button/button";
import { Chip } from "../../core/chip/chip";
import { Glyph } from "../../glyph";

export interface ComposerProps {
  /** The accessible name of the text area. */
  label: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Called with the text and the files when the user sends. The composer then clears itself. */
  onSend: (text: string, attachments: File[]) => void;
  disabled?: boolean;
  /** A reply is on its way: nothing can be sent; with onStop the send button becomes a stop button. */
  busy?: boolean;
  onStop?: () => void;
  /** The chosen files, when the page holds them. */
  attachments?: readonly File[];
  onAttachmentsChange?: (files: File[]) => void;
  /**
   * The file types that can be attached, as in a file chooser: "image/*,.pdf", or "*" for any file.
   * Attachments are on when this or `attachments` is given.
   */
  accept?: string;
  /** The most characters; a count shows near the limit. */
  maxLength?: number;
  /** Extra buttons at the start of the button row, e.g. a menu. */
  actions?: ReactNode;
}

const ANY = new Set(["*", "*/*"]);

/** The input for a new message at the bottom of a conversation. */
export function Composer({
  label,
  placeholder,
  value,
  defaultValue = "",
  onValueChange,
  onSend,
  disabled,
  busy,
  onStop,
  attachments,
  onAttachmentsChange,
  accept,
  maxLength,
  actions,
}: ComposerProps) {
  const id = useId();
  const [innerText, setInnerText] = useState(defaultValue);
  const [innerFiles, setInnerFiles] = useState<readonly File[]>([]);
  const [dropping, setDropping] = useState(false);
  const text = value ?? innerText;
  const files = attachments ?? innerFiles;
  const area = useRef<HTMLTextAreaElement>(null);
  const chooser = useRef<HTMLInputElement>(null);
  const withFiles = accept !== undefined || attachments !== undefined;
  const filter = accept && !ANY.has(accept.trim()) ? accept : undefined;
  const ready = !disabled && !busy && canSend(text, files.length);

  // Where the browser cannot size a field to its content, the script sets the height.
  useLayoutEffect(() => {
    const element = area.current;
    if (!element || CSS.supports("field-sizing", "content")) return;
    element.style.setProperty("--t-composer-h", "auto");
    const border = element.offsetHeight - element.clientHeight;
    element.style.setProperty("--t-composer-h", `${element.scrollHeight + border}px`);
  });

  const changeText = (next: string): void => {
    setInnerText(next);
    onValueChange?.(next);
  };
  const changeFiles = (next: File[]): void => {
    setInnerFiles(next);
    onAttachmentsChange?.(next);
  };
  const add = (list: FileList | readonly File[]): void => {
    const picked = [...list].filter((f) => accepts(f, filter));
    if (picked.length > 0) changeFiles([...files, ...picked]);
  };

  const send = (): void => {
    if (!ready) return;
    onSend(text, [...files]);
    changeText("");
    if (files.length > 0) changeFiles([]);
    area.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (!sendsOnKey({ ...event, isComposing: event.nativeEvent.isComposing, coarse })) return;
    event.preventDefault();
    send();
  };

  const onPaste = (event: ClipboardEvent<HTMLTextAreaElement>): void => {
    if (!withFiles || event.clipboardData.files.length === 0) return;
    add(event.clipboardData.files);
    if (!event.clipboardData.types.includes("text/plain")) event.preventDefault();
  };

  const dragsFiles = (event: DragEvent): boolean =>
    withFiles && !disabled && event.dataTransfer.types.includes("Files");
  const drop = {
    onDragOver: (event: DragEvent) => {
      if (!dragsFiles(event)) return;
      event.preventDefault();
      setDropping(true);
    },
    onDragLeave: (event: DragEvent) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropping(false);
    },
    onDrop: (event: DragEvent) => {
      if (!dragsFiles(event)) return;
      event.preventDefault();
      setDropping(false);
      add(event.dataTransfer.files);
    },
  };

  const countId = `${id}-count`;
  const counting = showsCount(text.length, maxLength);

  return (
    <div className="t-composer">
      <div className="t-composer-box" data-drop={dropping ? "" : undefined} {...drop}>
        {files.length > 0 ? (
          <ul className="t-composer-files" aria-label={t("chatAttachments")}>
            {files.map((f, index) => (
              <li key={`${f.name}-${f.size}-${f.lastModified}`}>
                <Chip
                  disabled={disabled}
                  onRemove={() => {
                    changeFiles(files.filter((_, i) => i !== index));
                    area.current?.focus();
                  }}
                >
                  {f.name}
                </Chip>
              </li>
            ))}
          </ul>
        ) : null}
        <textarea
          ref={area}
          className="t-composer-input"
          aria-label={label}
          aria-describedby={counting ? countId : undefined}
          rows={1}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          value={text}
          onChange={(event) => changeText(event.target.value)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
        />
        <div className="t-composer-bar">
          {actions || withFiles ? (
            <div className="t-composer-actions">
              {actions}
              {withFiles ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Glyph body={chatAttach} />}
                    label={t("chatAttachFiles")}
                    disabled={disabled}
                    onClick={() => chooser.current?.click()}
                  />
                  <input
                    ref={chooser}
                    type="file"
                    multiple
                    hidden
                    accept={filter}
                    tabIndex={-1}
                    onChange={(event) => {
                      if (event.target.files) add(event.target.files);
                      event.target.value = "";
                    }}
                  />
                </>
              ) : null}
            </div>
          ) : null}
          {counting && maxLength ? (
            <span
              className="t-composer-count"
              id={countId}
              data-tone={text.length >= maxLength ? "danger" : undefined}
            >
              {t("chatCharacters")
                .replace("{count}", String(text.length))
                .replace("{max}", String(maxLength))}
            </span>
          ) : null}
          {busy && onStop ? (
            <Button
              className="t-composer-send"
              variant="primary"
              size="sm"
              icon={<Glyph body={chatStop} />}
              label={t("chatStop")}
              onClick={onStop}
            />
          ) : (
            <Button
              className="t-composer-send"
              variant="primary"
              size="sm"
              icon={<Glyph body={chatSend} />}
              label={t("chatSend")}
              loading={busy}
              disabled={disabled}
              aria-disabled={ready ? undefined : true}
              onClick={send}
            />
          )}
        </div>
      </div>
    </div>
  );
}
