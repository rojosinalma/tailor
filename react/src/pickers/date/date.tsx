import { Popover } from "@base-ui/react/popover";
import { calendar, chevronLeft, chevronRight } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import {
  addMonths,
  focusDay,
  formatDate,
  formatLong,
  isOutOfBounds,
  monthGrid,
  monthLabel,
  moveByKey,
  parseIso,
  todayIso,
  type WeekStart,
  weekdayNames,
} from "@tailor/packs/pickers/date/logic";
import type spec from "@tailor/packs/pickers/date/spec";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { Glyph } from "../../glyph";
import { useIsStatic } from "../../kit";

export interface CalendarProps {
  value?: string | null;
  defaultValue?: string;
  onValueChange?: (iso: string) => void;
  min?: string;
  max?: string;
  /** 0 = Sunday, 1 = Monday. */
  weekStart?: WeekStart;
  locale?: string;
}

/** A month calendar. Usable on its own; the DatePicker shows it in a popup. */
export function Calendar({
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  weekStart = 1,
  locale,
}: CalendarProps) {
  const [inner, setInner] = useState<string | null>(defaultValue ?? null);
  const selected = value !== undefined ? value : inner;
  const today = todayIso();
  const bounds = { min, max, weekStart, today };

  const start = parseIso(selected) ?? parseIso(today);
  const [focus, setFocus] = useState(() =>
    start ? focusDay(start.year, start.month, selected, bounds) : today,
  );
  // A new value from outside shows its month.
  const [seen, setSeen] = useState(selected);
  if (seen !== selected) {
    setSeen(selected);
    if (parseIso(selected) && selected) setFocus(selected);
  }

  const root = useRef<HTMLDivElement>(null);
  const moved = useRef(false);
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    root.current?.querySelector<HTMLElement>(`[data-iso="${focus}"]`)?.focus();
  }, [focus]);

  const view = parseIso(focus) ?? { year: 1970, month: 0, day: 1 };
  const title = monthLabel(view.year, view.month, locale);
  const weeks = monthGrid(view.year, view.month, bounds);

  const choose = (iso: string): void => {
    if (isOutOfBounds(iso, bounds)) return;
    if (value === undefined) setInner(iso);
    setFocus(iso);
    onValueChange?.(iso);
  };

  const showMonth = (by: number): void => {
    const next = parseIso(addMonths(focus, by));
    if (next) setFocus(focusDay(next.year, next.month, selected, bounds));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTableElement>): void => {
    const next = moveByKey(focus, event.key, bounds);
    if (next === null) return;
    event.preventDefault();
    if (next === focus) return;
    moved.current = true;
    setFocus(next);
  };

  return (
    <div className="t-calendar" ref={root}>
      <div className="t-calendar-header">
        <button
          type="button"
          className="t-calendar-nav"
          aria-label={t("previous")}
          onClick={() => showMonth(-1)}
        >
          <Glyph body={chevronLeft} />
        </button>
        <div className="t-calendar-title" aria-live="polite">
          {title}
        </div>
        <button type="button" className="t-calendar-nav" aria-label={t("next")} onClick={() => showMonth(1)}>
          <Glyph body={chevronRight} />
        </button>
      </div>
      {/* biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: the APG date picker grid: a table with role grid, the days are its buttons. */}
      <table className="t-calendar-grid" role="grid" aria-label={title} onKeyDown={onKeyDown}>
        <thead>
          <tr>
            {weekdayNames(locale, weekStart).map((name) => (
              <th key={name.long} scope="col" abbr={name.long}>
                {name.short}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week[0]?.iso}>
              {week.map((day) => (
                // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole lint/a11y/useFocusableInteractive: the focusable part of the cell is its day button.
                <td key={day.iso} role="gridcell" aria-selected={day.iso === selected}>
                  <button
                    type="button"
                    className="t-calendar-day"
                    data-iso={day.iso}
                    tabIndex={day.iso === focus ? 0 : -1}
                    aria-label={formatLong(day.iso, locale)}
                    data-selected={day.iso === selected ? "" : undefined}
                    data-today={day.today ? "" : undefined}
                    data-outside={day.outside ? "" : undefined}
                    disabled={day.disabled}
                    onClick={() => choose(day.iso)}
                  >
                    {day.day}
                  </button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="t-calendar-footer">
        <button
          type="button"
          className="t-btn"
          data-variant="ghost"
          data-size="sm"
          disabled={isOutOfBounds(today, bounds)}
          onClick={() => choose(today)}
        >
          {t("today")}
        </button>
      </div>
    </div>
  );
}

export interface DatePickerProps {
  /** The ISO date (YYYY-MM-DD); null for no date. */
  value?: string | null;
  defaultValue?: string;
  onValueChange?: (iso: string) => void;
  min?: string;
  max?: string;
  name?: string;
  id?: string;
  disabled?: boolean;
  /** Shown while no date is set. */
  placeholder?: string;
  size?: (typeof spec.props.size)[number];
  /** 0 = Sunday, 1 = Monday. */
  weekStart?: WeekStart;
  locale?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

export function DatePicker({
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  name,
  id,
  disabled,
  placeholder = "Pick a date",
  size = "md",
  weekStart = 1,
  locale,
  ...aria
}: DatePickerProps) {
  const isStatic = useIsStatic();
  const [open, setOpen] = useState(false);
  const [inner, setInner] = useState<string | null>(defaultValue ?? null);
  const trigger = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const dataSize = size === "md" ? undefined : size;

  if (isStatic) {
    return (
      <input
        type="date"
        className="t-control t-input"
        data-t="date"
        data-size={dataSize}
        data-placeholder={placeholder}
        data-week-start={weekStart === 1 ? undefined : weekStart}
        data-locale={locale}
        name={name}
        id={id}
        defaultValue={value ?? defaultValue}
        min={min}
        max={max}
        disabled={disabled}
        {...aria}
      />
    );
  }

  const current = value !== undefined ? value : inner;
  const shown = parseIso(current) && current ? formatDate(current, locale) : null;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        ref={trigger}
        type="button"
        className="t-control t-date-trigger"
        aria-haspopup="dialog"
        data-size={dataSize}
        id={id}
        disabled={disabled}
        {...aria}
      >
        <span className="t-date-value" data-placeholder={shown ? undefined : ""}>
          {shown ?? placeholder}
        </span>
        <span className="t-date-icon">
          <Glyph body={calendar} />
        </span>
      </Popover.Trigger>
      <input type="hidden" name={name} value={current ?? ""} />
      <Popover.Portal>
        <Popover.Positioner className="t-popup-positioner" sideOffset={4} align="start">
          <Popover.Popup
            ref={popup}
            className="t-popup t-date-popup"
            role="dialog"
            {...aria}
            initialFocus={() =>
              popup.current?.querySelector<HTMLElement>('.t-calendar-day[tabindex="0"]:not(:disabled)') ??
              true
            }
            finalFocus={trigger}
          >
            <Calendar
              value={current}
              onValueChange={(iso) => {
                if (value === undefined) setInner(iso);
                onValueChange?.(iso);
                setOpen(false);
              }}
              min={min}
              max={max}
              weekStart={weekStart}
              locale={locale}
            />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
