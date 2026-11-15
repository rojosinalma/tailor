import { Popover } from "@base-ui/react/popover";
import { calendar } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import type { WeekStart } from "@tailor/packs/pickers/date/logic";
import {
  cleanRange,
  type DateRange,
  formatRange,
  pickDay,
  presetUsable,
  type RangePreset,
  shownRange,
} from "@tailor/packs/pickers/date-range/logic";
import type spec from "@tailor/packs/pickers/date-range/spec";
import { useRef, useState } from "react";
import { Glyph } from "../../glyph";
import { useIsStatic } from "../../kit";
import { Calendar, useValueName } from "../date/date";

export type { DateRange, RangePreset };

export interface DateRangePickerProps {
  /** The ISO days (YYYY-MM-DD) of the start and the end; null for none. */
  value?: DateRange | null;
  defaultValue?: DateRange;
  onValueChange?: (range: DateRange) => void;
  min?: string;
  max?: string;
  /** The form field of the start day. */
  nameStart?: string;
  /** The form field of the end day. */
  nameEnd?: string;
  disabled?: boolean;
  /** Shown while no range is set. */
  placeholder?: string;
  /** Short ranges beside the calendar, e.g. "Last 7 days". */
  presets?: readonly RangePreset[];
  size?: (typeof spec.props.size)[number];
  /** 0 = Sunday, 1 = Monday. */
  weekStart?: WeekStart;
  locale?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
}

const PHONE = "(max-width: 40rem)";

/** A start and an end day, picked in one calendar: two months side by side, one month in the phone sheet. */
export function DateRangePicker({
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  nameStart,
  nameEnd,
  disabled,
  placeholder = t("pickRange"),
  presets = [],
  size = "md",
  weekStart = 1,
  locale,
  ...aria
}: DateRangePickerProps) {
  const isStatic = useIsStatic();
  const [open, setOpen] = useState(false);
  const [inner, setInner] = useState<DateRange>(cleanRange(defaultValue));
  const [draft, setDraft] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [months, setMonths] = useState<1 | 2>(2);
  const trigger = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const dataSize = size === "md" ? undefined : size;
  const current = value !== undefined ? cleanRange(value) : inner;
  const shown = current.start && current.end ? formatRange(current, locale) : null;
  const named = useValueName(aria, shown ?? placeholder);
  const usable = presets.filter((preset) => presetUsable(preset, min, max));
  const group = {
    role: "group",
    "aria-label": aria["aria-label"],
    "aria-labelledby": aria["aria-labelledby"],
  };

  if (isStatic) {
    const input = (which: "start" | "end") => (
      <input
        type="date"
        className="t-control t-input"
        name={which === "start" ? nameStart : nameEnd}
        aria-label={t(which === "start" ? "rangeStart" : "rangeEnd")}
        defaultValue={current[which] ?? undefined}
        min={min}
        max={max}
        disabled={disabled}
      />
    );
    return (
      <span
        className="t-date-range"
        data-t="date-range"
        data-size={dataSize}
        data-placeholder={placeholder}
        data-week-start={weekStart === 1 ? undefined : weekStart}
        data-locale={locale}
        data-presets={usable.length ? JSON.stringify(usable) : undefined}
        aria-describedby={aria["aria-describedby"]}
        {...group}
      >
        {input("start")}
        {input("end")}
      </span>
    );
  }

  const commit = (range: DateRange): void => {
    if (value === undefined) setInner(range);
    onValueChange?.(range);
    setOpen(false);
  };

  const onOpenChange = (next: boolean): void => {
    setOpen(next);
    setDraft(null);
    setHover(null);
    if (next) setMonths(matchMedia(PHONE).matches ? 1 : 2);
  };

  return (
    <span className="t-date-range" {...group}>
      <Popover.Root open={open} onOpenChange={onOpenChange}>
        <Popover.Trigger
          ref={trigger}
          type="button"
          className="t-control t-date-range-trigger"
          aria-haspopup="dialog"
          data-size={dataSize}
          disabled={disabled}
          aria-describedby={aria["aria-describedby"]}
          {...named.trigger}
        >
          <span className="t-date-range-value" id={named.valueId} data-placeholder={shown ? undefined : ""}>
            {shown ?? placeholder}
          </span>
          <span className="t-date-range-icon">
            <Glyph body={calendar} />
          </span>
        </Popover.Trigger>
        <input type="hidden" name={nameStart} value={current.start ?? ""} />
        <input type="hidden" name={nameEnd} value={current.end ?? ""} />
        <Popover.Portal>
          <Popover.Positioner className="t-popup-positioner" sideOffset={4} align="start">
            <Popover.Popup
              ref={popup}
              className="t-popup t-date-range-popup"
              role="dialog"
              aria-label={aria["aria-label"]}
              aria-labelledby={aria["aria-labelledby"]}
              initialFocus={() =>
                popup.current?.querySelector<HTMLElement>('.t-calendar-day[tabindex="0"]:not(:disabled)') ??
                true
              }
              finalFocus={trigger}
            >
              {usable.length ? (
                <fieldset className="t-date-range-presets" aria-label={t("rangePresets")}>
                  {usable.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      className="t-btn"
                      data-variant="ghost"
                      data-size="sm"
                      onClick={() => commit({ start: preset.start, end: preset.end })}
                    >
                      {preset.label}
                    </button>
                  ))}
                </fieldset>
              ) : null}
              <Calendar
                value={draft ?? current.start}
                range={shownRange(current, draft, hover)}
                months={months}
                onValueChange={(iso) => {
                  const next = pickDay(draft, iso);
                  setDraft(next.draft);
                  setHover(null);
                  if (next.done) commit(next.done);
                }}
                onDayFocus={setHover}
                min={min}
                max={max}
                weekStart={weekStart}
                locale={locale}
              />
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </span>
  );
}
