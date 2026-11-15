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
import {
  type KeyboardEvent,
  type RefObject,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { type FieldControlProps, useFieldControl } from "../../core/field/field";
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

export interface PickerAria {
  readonly "aria-label"?: string;
  readonly "aria-labelledby"?: string;
  readonly "aria-describedby"?: string;
}

/** The label element of a Field around the control with this id (a group is not labelable, so search by for). */
export const fieldLabelFor = (id: string | undefined): HTMLLabelElement | null =>
  id ? document.querySelector<HTMLLabelElement>(`label[for="${CSS.escape(id)}"]`) : null;

/**
 * The Field wiring of a picker whose trigger shows a value. The trigger's accessible name is "label: value":
 * the own aria-label, the own aria-labelledby or the label of the Field around it, then the shown text.
 */
export function usePickerField(own: FieldControlProps, aria: PickerAria, text: string) {
  const field = useFieldControl({ ...own, "aria-describedby": aria["aria-describedby"] });
  const valueId = useId();
  const ref = useRef<HTMLButtonElement>(null);
  const [fieldLabel, setFieldLabel] = useState<string>();
  const label = aria["aria-label"];
  const labelledBy = aria["aria-labelledby"] ?? fieldLabel;
  useLayoutEffect(() => {
    if (label || aria["aria-labelledby"]) return;
    const element = fieldLabelFor(field.id);
    if (!element) return;
    element.id ||= `${valueId}-label`;
    setFieldLabel(element.id);
  });
  const described = { "aria-invalid": field["aria-invalid"], "aria-describedby": field["aria-describedby"] };
  return {
    field,
    ref,
    valueId,
    /** The native control of the static markup. */
    native: { ...field, "aria-label": label, "aria-labelledby": aria["aria-labelledby"] },
    trigger: {
      ...described,
      id: field.id,
      disabled: field.disabled,
      "aria-label": label ? `${label}: ${text}` : undefined,
      "aria-labelledby": labelledBy ? `${labelledBy} ${valueId}` : undefined,
    },
    /** The popup takes the label without the value. */
    popup: { "aria-label": label, "aria-labelledby": labelledBy },
  };
}

/**
 * The Field wiring of a group (radios, a drop zone, code boxes): the group takes the Field's label as its name
 * unless it has its own, and a click on that label focuses the first match inside the group of the selectors
 * in `target`, tried in order and joined by "|".
 */
export function useFieldGroup(
  own: FieldControlProps,
  label: string | undefined,
  target: string,
): { field: FieldControlProps; ref: RefObject<HTMLDivElement | null>; labelledBy: string | undefined } {
  const field = useFieldControl(own);
  const ref = useRef<HTMLDivElement>(null);
  const fallback = useId();
  const [labelledBy, setLabelledBy] = useState<string>();
  useLayoutEffect(() => {
    if (label) return;
    const element = fieldLabelFor(field.id);
    if (!element) return;
    element.id ||= `${fallback}-label`;
    setLabelledBy(element.id);
    const focus = (event: MouseEvent): void => {
      event.preventDefault();
      for (const selector of target.split("|")) {
        const found = ref.current?.querySelector<HTMLElement>(selector);
        if (found) {
          found.focus();
          return;
        }
      }
    };
    element.addEventListener("click", focus);
    return () => element.removeEventListener("click", focus);
  }, [label, field.id, fallback, target]);
  return { field, ref, labelledBy };
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
  required?: boolean;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
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
  required,
  placeholder = t("pickDate"),
  size = "md",
  weekStart = 1,
  locale,
  ...aria
}: DatePickerProps) {
  const isStatic = useIsStatic();
  const [open, setOpen] = useState(false);
  const [inner, setInner] = useState<string | null>(defaultValue ?? null);
  const popup = useRef<HTMLDivElement>(null);
  const dataSize = size === "md" ? undefined : size;
  const current = value !== undefined ? value : inner;
  const shown = parseIso(current) && current ? formatDate(current, locale) : null;
  const picker = usePickerField({ id, name, disabled, required }, aria, shown ?? placeholder);

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
        {...picker.native}
        defaultValue={value ?? defaultValue}
        min={min}
        max={max}
      />
    );
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        ref={picker.ref}
        type="button"
        className="t-control t-date-trigger"
        aria-haspopup="dialog"
        data-size={dataSize}
        {...picker.trigger}
      >
        <span className="t-date-value" id={picker.valueId} data-placeholder={shown ? undefined : ""}>
          {shown ?? placeholder}
        </span>
        <span className="t-date-icon">
          <Glyph body={calendar} />
        </span>
      </Popover.Trigger>
      <input type="hidden" name={picker.field.name} value={current ?? ""} />
      <Popover.Portal>
        <Popover.Positioner className="t-popup-positioner" sideOffset={4} align="start">
          <Popover.Popup
            ref={popup}
            className="t-popup t-date-popup"
            role="dialog"
            {...picker.popup}
            initialFocus={() =>
              popup.current?.querySelector<HTMLElement>('.t-calendar-day[tabindex="0"]:not(:disabled)') ??
              true
            }
            finalFocus={picker.ref}
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
