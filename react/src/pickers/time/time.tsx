import { Popover } from "@base-ui/react/popover";
import { clock } from "@tailor/core/glyphs.gen";
import { type TextKey, t } from "@tailor/core/text";
import {
  type ColumnKey,
  formatTime,
  matchTyped,
  moveOption,
  parseTime,
  printTime,
  setPart,
  startTime,
  type Time,
  type TimeColumn,
  type TimeSettings,
  timeColumns,
  uses12Hour,
} from "@tailor/packs/pickers/time/logic";
import type spec from "@tailor/packs/pickers/time/spec";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { Glyph } from "../../glyph";
import { useIsStatic } from "../../kit";
import { usePickerField } from "../date/date";

export interface TimePickerProps {
  /** "HH:MM", or "HH:MM:SS" with `seconds`, in 24-hour time; null for no time. */
  value?: string | null;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** The minute step of the minute column. */
  step?: number;
  /** Adds a seconds column. */
  seconds?: boolean;
  /** A 12-hour clock with AM/PM; by default the clock of the locale. */
  hour12?: boolean;
  min?: string;
  max?: string;
  name?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  /** Shown while no time is set. */
  placeholder?: string;
  size?: (typeof spec.props.size)[number];
  locale?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
}

export const COLUMN_LABEL: Record<ColumnKey, TextKey> = {
  hour: "timeHours",
  minute: "timeMinutes",
  second: "timeSeconds",
  period: "timePeriod",
};

/** Moves a column's scroll so that its selected row sits in the middle. */
export function centerSelected(column: HTMLElement): void {
  const row = column.querySelector<HTMLElement>("[aria-selected='true']");
  if (row) column.scrollTop = row.offsetTop - (column.clientHeight - row.offsetHeight) / 2;
}

interface ColumnsProps {
  readonly time: Time;
  readonly settings: TimeSettings;
  readonly onPick: (time: Time) => void;
  readonly onDone: () => void;
}

function Columns({ time, settings, onPick, onDone }: ColumnsProps) {
  const prefix = useId();
  const root = useRef<HTMLDivElement>(null);
  const typed = useRef({ text: "", at: 0 });
  const columns = timeColumns(time, settings);

  useEffect(() => {
    for (const column of root.current?.querySelectorAll<HTMLElement>(".t-time-column") ?? [])
      centerSelected(column);
  });

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>, column: TimeColumn, index: number): void => {
    const { key } = event;
    const current = column.options.findIndex((o) => o.selected);
    let to = moveOption(column.options, current, key);
    if (key === "ArrowLeft" || key === "ArrowRight") {
      const lists = [...(root.current?.querySelectorAll<HTMLElement>(".t-time-column") ?? [])];
      lists[index + (key === "ArrowLeft" ? -1 : 1)]?.focus();
    } else if (key === "Enter") {
      onPick(time);
      onDone();
    } else if (to === null && key.length === 1 && !event.ctrlKey && !event.metaKey) {
      const now = Date.now();
      typed.current = { text: now - typed.current.at > 1000 ? key : typed.current.text + key, at: now };
      to = matchTyped(column.options, typed.current.text);
      if (to < 0) to = matchTyped(column.options, key);
      if (to < 0) return;
    } else if (to === null) return;
    event.preventDefault();
    const option = to === null ? undefined : column.options[to];
    if (option) onPick(setPart(time, column.key, option.value, settings));
  };

  return (
    <div className="t-time-columns" ref={root}>
      {columns.map((column, index) => {
        const selected = column.options.findIndex((o) => o.selected);
        return (
          <div
            key={column.key}
            className="t-time-column"
            role="listbox"
            tabIndex={0}
            aria-label={t(COLUMN_LABEL[column.key])}
            aria-activedescendant={selected >= 0 ? `${prefix}-${column.key}-${selected}` : undefined}
            onKeyDown={(event) => onKeyDown(event, column, index)}
          >
            {column.options.map((option, i) => (
              // biome-ignore lint/a11y/useKeyWithClickEvents lint/a11y/useFocusableInteractive: the listbox takes the focus and the keys (aria-activedescendant), its options take clicks.
              <div
                key={option.value}
                id={`${prefix}-${column.key}-${i}`}
                className="t-option"
                role="option"
                aria-selected={option.selected}
                aria-disabled={option.disabled || undefined}
                data-highlighted={option.selected ? "" : undefined}
                onClick={() => {
                  if (!option.disabled) onPick(setPart(time, column.key, option.value, settings));
                }}
              >
                <span className="t-option-label">{option.text}</span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

/** A time of day picked from columns. The value is 24-hour time, as in <input type="time">. */
export function TimePicker({
  value,
  defaultValue,
  onValueChange,
  step = 5,
  seconds = false,
  hour12,
  min,
  max,
  name,
  id,
  disabled,
  required,
  placeholder = t("pickTime"),
  size = "md",
  locale,
  ...aria
}: TimePickerProps) {
  const isStatic = useIsStatic();
  const [open, setOpen] = useState(false);
  const [inner, setInner] = useState<string | null>(defaultValue ?? null);
  const [draft, setDraft] = useState<Time | null>(null);
  const popup = useRef<HTMLDivElement>(null);
  const dataSize = size === "md" ? undefined : size;
  const twelve = uses12Hour(locale, hour12);
  const settings: TimeSettings = { step, seconds, hour12: twelve, min, max, locale };
  const current = value !== undefined ? value : inner;
  const time = parseTime(current);
  const shown = time ? formatTime(time, twelve, seconds, locale) : null;
  const picker = usePickerField({ id, name, disabled, required }, aria, shown ?? placeholder);

  if (isStatic) {
    return (
      <span className="t-time-picker">
        <input
          type="time"
          className="t-control t-input"
          data-t="time"
          data-size={dataSize}
          data-placeholder={placeholder}
          data-step={step === 5 ? undefined : step}
          data-seconds={seconds ? "" : undefined}
          data-hour12={hour12 === undefined ? undefined : String(hour12)}
          data-locale={locale}
          {...picker.native}
          defaultValue={current ?? undefined}
          min={min}
          max={max}
          step={seconds ? 1 : step * 60}
        />
      </span>
    );
  }

  const pick = (next: Time): void => {
    setDraft(next);
    const text = printTime(next, seconds);
    if (text === current) return;
    if (value === undefined) setInner(text);
    onValueChange?.(text);
  };

  return (
    <span className="t-time-picker">
      <Popover.Root
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) setDraft(time ?? startTime(settings));
        }}
      >
        <Popover.Trigger
          ref={picker.ref}
          type="button"
          className="t-control t-time-trigger"
          aria-haspopup="dialog"
          data-size={dataSize}
          {...picker.trigger}
        >
          <span className="t-time-value" id={picker.valueId} data-placeholder={shown ? undefined : ""}>
            {shown ?? placeholder}
          </span>
          <span className="t-time-icon">
            <Glyph body={clock} />
          </span>
        </Popover.Trigger>
        <input type="hidden" name={picker.field.name} value={current ?? ""} />
        <Popover.Portal>
          <Popover.Positioner className="t-popup-positioner" sideOffset={4} align="start">
            <Popover.Popup
              ref={popup}
              className="t-popup t-time-popup"
              role="dialog"
              {...picker.popup}
              initialFocus={() => popup.current?.querySelector<HTMLElement>(".t-time-column") ?? true}
              finalFocus={picker.ref}
            >
              {draft ? (
                <Columns time={draft} settings={settings} onPick={pick} onDone={() => setOpen(false)} />
              ) : null}
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </span>
  );
}
