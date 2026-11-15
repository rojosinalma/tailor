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
  monthOf,
  moveByKey,
  parseIso,
  rangeMarks,
  todayIso,
  viewFor,
  type WeekStart,
  weekdayNames,
} from "@tailor/packs/pickers/date/logic";
import type spec from "@tailor/packs/pickers/date/spec";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
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
  /** Marks a range: its ends and the days between. The end is null while the range is in progress. */
  range?: { readonly start: string | null; readonly end: string | null };
  /** Months shown side by side. */
  months?: 1 | 2;
  /** Runs when the pointer or the keyboard rests on a day: a range picker previews its range. */
  onDayFocus?: (iso: string) => void;
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
  range,
  months = 1,
  onDayFocus,
}: CalendarProps) {
  const [inner, setInner] = useState<string | null>(defaultValue ?? null);
  const selected = value !== undefined ? value : inner;
  const today = todayIso();
  const bounds = { min, max, weekStart, today };

  const start = parseIso(selected) ?? parseIso(today);
  const [focus, setFocusState] = useState(() =>
    start ? focusDay(start.year, start.month, selected, bounds) : today,
  );
  const [view, setView] = useState(() => monthOf(focus));
  const setFocus = (iso: string): void => {
    setFocusState(iso);
    setView((shown) => viewFor(shown, iso, months));
  };
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

  const choose = (iso: string): void => {
    if (isOutOfBounds(iso, bounds)) return;
    if (value === undefined) setInner(iso);
    setFocus(iso);
    onValueChange?.(iso);
  };

  const showMonth = (by: number): void => {
    const next = parseIso(addMonths(view, by));
    if (!next) return;
    setView(monthOf(addMonths(view, by)));
    setFocusState(focusDay(next.year, next.month, selected, bounds));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTableElement>): void => {
    const next = moveByKey(focus, event.key, bounds);
    if (next === null) return;
    event.preventDefault();
    if (next === focus) return;
    moved.current = true;
    setFocus(next);
    onDayFocus?.(next);
  };

  const shown = Array.from({ length: months }, (_, i) => parseIso(addMonths(view, i)) ?? start);
  const names = weekdayNames(locale, weekStart);

  return (
    <div className="t-calendar" ref={root}>
      <div className="t-calendar-months">
        {shown.map((month, index) => {
          if (!month) return null;
          const title = monthLabel(month.year, month.month, locale);
          const nav = (by: -1 | 1) =>
            (by === -1 ? index === 0 : index === months - 1) ? (
              <button
                type="button"
                className="t-calendar-nav"
                aria-label={t(by === -1 ? "previous" : "next")}
                onClick={() => showMonth(by)}
              >
                <Glyph body={by === -1 ? chevronLeft : chevronRight} />
              </button>
            ) : (
              <span className="t-calendar-nav" aria-hidden="true" />
            );
          return (
            <div className="t-calendar-month" key={title}>
              <div className="t-calendar-header">
                {nav(-1)}
                <div className="t-calendar-title" aria-live="polite">
                  {title}
                </div>
                {nav(1)}
              </div>
              {/* biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: the APG date picker grid: a table with role grid, the days are its buttons. */}
              <table className="t-calendar-grid" role="grid" aria-label={title} onKeyDown={onKeyDown}>
                <thead>
                  <tr>
                    {names.map((name) => (
                      <th key={name.long} scope="col" abbr={name.long}>
                        {name.short}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthGrid(month.year, month.month, bounds).map((week) => (
                    <tr key={week[0]?.iso}>
                      {week.map((day) => {
                        // Side by side months show each day once.
                        if (day.outside && months > 1) return <td key={day.iso} />;
                        const marks = rangeMarks(day.iso, range?.start ?? null, range?.end ?? null);
                        const picked = day.iso === selected || marks.start || marks.end;
                        return (
                          // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole lint/a11y/useFocusableInteractive: the focusable part of the cell is its day button.
                          <td key={day.iso} role="gridcell" aria-selected={picked || marks.inside}>
                            <button
                              type="button"
                              className="t-calendar-day"
                              data-iso={day.iso}
                              tabIndex={day.iso === focus ? 0 : -1}
                              aria-label={formatLong(day.iso, locale)}
                              data-selected={picked ? "" : undefined}
                              data-range-start={marks.start ? "" : undefined}
                              data-range-end={marks.end ? "" : undefined}
                              data-in-range={marks.inside ? "" : undefined}
                              data-today={day.today ? "" : undefined}
                              data-outside={day.outside ? "" : undefined}
                              disabled={day.disabled}
                              onClick={() => choose(day.iso)}
                              onPointerEnter={
                                onDayFocus && !day.disabled ? () => onDayFocus(day.iso) : undefined
                              }
                            >
                              {day.day}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
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

/** The accessible name of a trigger that shows a value: the label, then the shown text. */
export function useValueName(
  aria: { readonly "aria-label"?: string; readonly "aria-labelledby"?: string },
  text: string,
): { trigger: { "aria-label"?: string; "aria-labelledby"?: string }; valueId: string } {
  const valueId = useId();
  const label = aria["aria-label"];
  const labelledBy = aria["aria-labelledby"];
  return {
    valueId,
    trigger: {
      "aria-label": label ? `${label}: ${text}` : undefined,
      "aria-labelledby": labelledBy ? `${labelledBy} ${valueId}` : undefined,
    },
  };
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
  placeholder = t("pickDate"),
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
  const current = value !== undefined ? value : inner;
  const shown = parseIso(current) && current ? formatDate(current, locale) : null;
  const named = useValueName(aria, shown ?? placeholder);

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
        {...named.trigger}
      >
        <span className="t-date-value" id={named.valueId} data-placeholder={shown ? undefined : ""}>
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
