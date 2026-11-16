import { Popover } from "@base-ui/react/popover";
import { chevronLeft, chevronRight, close } from "@tailor/core/glyphs.gen";
import type { Tone } from "@tailor/core/spec";
import { t } from "@tailor/core/text";
import {
  eventLabel,
  eventsOn,
  fill,
  formatDayLong,
  formatHour,
  formatWeekday,
  type LabelTexts,
  layoutDay,
  layoutWeek,
  minutesOf,
  momentText,
  monthWeeks,
  type Placed,
  periodRange,
  periodTitle,
  placeAll,
  shiftDate,
  timeText,
  weekDays,
} from "@tailor/packs/calendar/calendar-view/logic";
import type spec from "@tailor/packs/calendar/calendar-view/spec";
import { addDays, formatLong, moveByKey, todayIso, type WeekStart } from "@tailor/packs/pickers/date/logic";
import {
  type KeyboardEvent,
  type MouseEvent,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "../../core/button/button";
import { Segmented } from "../../core/segmented/segmented";
import { Glyph } from "../../glyph";
import { AppLink } from "../../link";

export interface CalendarEvent {
  readonly id: string;
  readonly title: string;
  /** "2026-11-15" for a whole day, "2026-11-15T14:30" for a time (local time). */
  readonly start: string;
  /** A whole-day event: its last day. A timed event: its end; one hour when left out. */
  readonly end?: string;
  readonly allDay?: boolean;
  readonly tone?: Tone;
  /** Makes the event a link. */
  readonly to?: string;
}

export type CalendarViewMode = (typeof spec.props.view)[number];

export interface CalendarViewProps {
  /** The accessible name of the calendar. */
  label: string;
  events: readonly CalendarEvent[];
  view?: CalendarViewMode;
  defaultView?: CalendarViewMode;
  onViewChange?: (view: CalendarViewMode) => void;
  /** The ISO day that the view shows and that holds the focus. */
  date?: string;
  /** Today when left out. */
  defaultDate?: string;
  onDateChange?: (date: string) => void;
  onSelectEvent?: (event: CalendarEvent) => void;
  /** A day (Enter in the month) or a time (a click in the week) was picked, to add an event. */
  onSelectSlot?: (start: string, end: string) => void;
  /** 0 = Sunday, 1 = Monday. */
  weekStart?: WeekStart;
  locale?: string;
}

/** Bars per day in the month; the rest goes behind "+N more". */
const MAX_LANES = 3;
/** The first hour on show in the week. */
const WORK_START = 8;
const VIEWS: readonly CalendarViewMode[] = ["month", "week", "agenda"];

const texts = (): LabelTexts => ({ allDay: t("calendarAllDay"), range: t("calendarRange") });

/** Sets custom properties on an element, for the geometry that only the data knows. */
const vars =
  (values: Record<string, number>) =>
  (element: HTMLElement | null): void => {
    if (!element) return;
    for (const [name, value] of Object.entries(values)) element.style.setProperty(name, String(value));
  };

interface EventItemProps {
  item: Placed<CalendarEvent>;
  locale?: string;
  tabIndex?: number;
  onSelect: (event: CalendarEvent, element: HTMLElement) => void;
  geometry?: Record<string, number>;
  data?: Record<string, string | undefined>;
  /** The time shown next to the title. The title is then the action and its hit area covers the event. */
  time?: string;
}

/** One event: a link when it has an address, else a button. */
function EventItem({ item, locale, tabIndex, onSelect, geometry, data, time }: EventItemProps) {
  const { event } = item;
  const look = {
    className: "t-calendar-view-event",
    "data-tone": event.tone ?? "accent",
    "data-timed": item.startMinutes === null || item.allDayRow ? undefined : "",
    ref: geometry ? vars(geometry) : undefined,
    ...data,
  };
  const action = {
    className: time === undefined ? look.className : "t-calendar-view-hit",
    "aria-label": eventLabel(item, texts(), locale),
    tabIndex,
  };
  const own = time === undefined ? { ...look, ...action } : action;
  const title =
    time === undefined ? event.title : <span className="t-calendar-view-name">{event.title}</span>;
  const control = event.to ? (
    <AppLink
      to={event.to}
      {...own}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => onSelect(event, e.currentTarget)}
    >
      {title}
    </AppLink>
  ) : (
    <button type="button" {...own} onClick={(e) => onSelect(event, e.currentTarget)}>
      {title}
    </button>
  );
  if (time === undefined) return control;
  return (
    <div {...look}>
      {control}
      <span className="t-calendar-view-time">{time}</span>
    </div>
  );
}

/** The rows of an agenda: the events of one day with their times. */
function AgendaList({
  items,
  locale,
  onSelect,
}: {
  items: readonly Placed<CalendarEvent>[];
  locale?: string;
  onSelect: EventItemProps["onSelect"];
}) {
  return (
    <ul className="t-calendar-view-list">
      {items.map((item) => (
        <li key={item.event.id}>
          <EventItem
            item={item}
            locale={locale}
            onSelect={onSelect}
            data={{ "data-row": "" }}
            time={timeText(item, texts(), locale)}
          />
        </li>
      ))}
    </ul>
  );
}

/** The current minute, kept fresh for the "now" line. */
function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

/** A calendar of events: month, week and agenda. */
export function CalendarView({
  label,
  events,
  view,
  defaultView = "month",
  onViewChange,
  date,
  defaultDate,
  onDateChange,
  onSelectEvent,
  onSelectSlot,
  weekStart = 1,
  locale,
}: CalendarViewProps) {
  const [ownView, setOwnView] = useState<CalendarViewMode>(defaultView);
  const [ownDate, setOwnDate] = useState(() => defaultDate ?? todayIso());
  const shownView = view ?? ownView;
  const current = date ?? ownDate;
  const today = todayIso();
  const now = useNow();
  const titleId = useId();
  const items = useMemo(() => placeAll(events), [events]);

  const root = useRef<HTMLDivElement>(null);
  const agendaBelow = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLElement>(null);
  const moved = useRef(false);
  const [popDay, setPopDay] = useState<{ iso: string; anchor: HTMLElement } | null>(null);

  const setDate = (next: string): void => {
    if (next === current) return;
    if (date === undefined) setOwnDate(next);
    onDateChange?.(next);
  };
  const setView = (next: string): void => {
    const found = VIEWS.find((v) => v === next);
    if (!found) return;
    if (view === undefined) setOwnView(found);
    onViewChange?.(found);
  };

  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    root.current?.querySelector<HTMLElement>(`.t-calendar-view-date[data-iso="${current}"]`)?.focus();
  }, [current]);

  // The week opens on the working hours.
  useLayoutEffect(() => {
    if (shownView !== "week" || !scroller.current) return;
    const hours = scroller.current.querySelector<HTMLElement>(".t-calendar-view-hours");
    if (hours) scroller.current.scrollTop = (hours.offsetHeight / 24) * WORK_START;
  }, [shownView]);

  const title = periodTitle(shownView, current, weekStart, locale);

  const selectEvent = (event: CalendarEvent, element: HTMLElement): void => {
    if (onSelectEvent) onSelectEvent(event);
    else if (shownView === "month" && !event.to) {
      const day = element.closest<HTMLElement>("[data-day]")?.dataset.day;
      if (day) setPopDay({ iso: day, anchor: element });
    }
  };

  /** Enter or a click on a day: pick it, then open it. */
  const openDay = (iso: string, element: HTMLElement, outside: boolean): void => {
    const narrow = agendaBelow.current?.checkVisibility() ?? false;
    const wasPicked = iso === current;
    if (iso !== current) {
      moved.current = outside;
      setDate(iso);
    }
    if (outside || (narrow && !wasPicked)) return;
    if (onSelectSlot) onSelectSlot(iso, addDays(iso, 1));
    else if (!narrow && eventsOn(items, iso).length > 0) setPopDay({ iso, anchor: element });
  };

  const onGridKey = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (!(event.target instanceof HTMLElement) || !event.target.classList.contains("t-calendar-view-date"))
      return;
    const next = moveByKey(current, event.key, { weekStart });
    if (next === null) return;
    event.preventDefault();
    moved.current = true;
    setDate(next);
  };

  const countText = (n: number): string =>
    n === 1 ? t("calendarOneEvent") : fill(t("calendarEvents"), { count: n });

  const renderMonth = () => {
    const weeks = monthWeeks(current, weekStart, today);
    const names = weekDays(current, weekStart);
    const picked = eventsOn(items, current);
    return (
      <>
        {/* biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: the APG grid pattern: a table with role grid, the days are its buttons. */}
        <table className="t-calendar-view-month" role="grid" aria-labelledby={titleId} onKeyDown={onGridKey}>
          <thead>
            <tr className="t-calendar-view-weekdays">
              {names.map((iso) => (
                <th scope="col" key={iso} abbr={formatWeekday(iso, locale, "long")}>
                  {formatWeekday(iso, locale)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week) => {
              const days = week.map((d) => d.iso);
              const { segments, lanes } = layoutWeek(days, items);
              const shown = Math.min(lanes, MAX_LANES);
              return (
                <tr className="t-calendar-view-week" key={days[0]}>
                  {week.map((day, col) => {
                    const dayItems = eventsOn(items, day.iso);
                    const hidden = segments.filter(
                      (s) => s.lane >= MAX_LANES && s.col <= col && s.col + s.span > col,
                    ).length;
                    const focused = day.iso === current;
                    return (
                      // biome-ignore lint/a11y/useFocusableInteractive: its day button takes the focus.
                      <td
                        className="t-calendar-view-day"
                        // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: a cell of the grid pattern.
                        role="gridcell"
                        key={day.iso}
                        data-day={day.iso}
                        aria-selected={focused}
                        data-today={day.today ? "" : undefined}
                        data-outside={day.outside ? "" : undefined}
                      >
                        <button
                          type="button"
                          className="t-calendar-view-date"
                          data-iso={day.iso}
                          tabIndex={focused ? 0 : -1}
                          aria-label={`${formatLong(day.iso, locale)}, ${dayItems.length ? countText(dayItems.length) : t("calendarNoEvents")}`}
                          onClick={(e) => openDay(day.iso, e.currentTarget, day.outside)}
                        >
                          <span className="t-calendar-view-num">{day.day}</span>
                          {dayItems.length > 0 ? (
                            <span className="t-calendar-view-dots" aria-hidden="true">
                              {dayItems.slice(0, MAX_LANES).map((item) => (
                                <span key={item.event.id} data-tone={item.event.tone ?? "accent"} />
                              ))}
                            </span>
                          ) : null}
                        </button>
                        {shown > 0 ? (
                          <div className="t-calendar-view-lanes">
                            {Array.from({ length: shown }, (_, lane) => {
                              const seg = segments.find((s) => s.lane === lane && s.col === col);
                              if (!seg) return <span className="t-calendar-view-slot" key={String(lane)} />;
                              return (
                                <EventItem
                                  key={seg.item.event.id}
                                  item={seg.item}
                                  locale={locale}
                                  tabIndex={focused ? 0 : -1}
                                  onSelect={selectEvent}
                                  geometry={{ "--t-span": seg.span }}
                                  data={{
                                    "data-before": seg.before ? "" : undefined,
                                    "data-after": seg.after ? "" : undefined,
                                  }}
                                />
                              );
                            })}
                          </div>
                        ) : null}
                        {hidden > 0 ? (
                          <button
                            type="button"
                            className="t-calendar-view-more"
                            tabIndex={focused ? 0 : -1}
                            aria-label={`${fill(t("calendarMore"), { count: hidden })}, ${formatDayLong(day.iso, locale)}`}
                            onClick={(e) => setPopDay({ iso: day.iso, anchor: e.currentTarget })}
                          >
                            {fill(t("calendarMore"), { count: hidden })}
                          </button>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        <section className="t-calendar-view-picked" ref={agendaBelow} aria-labelledby={`${titleId}-picked`}>
          <h3 className="t-calendar-view-agenda-title" id={`${titleId}-picked`}>
            {formatDayLong(current, locale)}
          </h3>
          {picked.length > 0 ? (
            <AgendaList items={picked} locale={locale} onSelect={selectEvent} />
          ) : (
            <p className="t-calendar-view-empty">{t("calendarNoEvents")}</p>
          )}
        </section>
      </>
    );
  };

  const renderWeek = () => {
    const days = weekDays(current, weekStart);
    const { segments, lanes } = layoutWeek(
      days,
      items.filter((item) => item.allDayRow),
    );
    const nowMinutes = minutesOf(now);
    const pickSlot = (iso: string, event: MouseEvent<HTMLDivElement>): void => {
      if (!onSelectSlot || event.target !== event.currentTarget) return;
      const box = event.currentTarget.getBoundingClientRect();
      const minutes = Math.floor((((event.clientY - box.top) / box.height) * 1440) / 30) * 30;
      onSelectSlot(momentText(iso, minutes), momentText(iso, minutes + 60));
    };
    return (
      <div className="t-calendar-view-weekgrid">
        <div className="t-calendar-view-heads">
          {days.map((iso) => (
            <button
              type="button"
              className="t-calendar-view-head"
              key={iso}
              aria-pressed={iso === current}
              data-today={iso === today ? "" : undefined}
              onClick={() => setDate(iso)}
            >
              <span className="t-calendar-view-weekday">{formatWeekday(iso, locale)}</span>
              <span className="t-calendar-view-num">{Number(iso.slice(8))}</span>
            </button>
          ))}
        </div>
        {lanes > 0 ? (
          <div className="t-calendar-view-allday">
            <span className="t-calendar-view-allday-label">{t("calendarAllDay")}</span>
            {segments.map((seg) => (
              <EventItem
                key={seg.item.event.id}
                item={seg.item}
                locale={locale}
                onSelect={selectEvent}
                geometry={{ "--t-col": seg.col + 2, "--t-span": seg.span, "--t-lane": seg.lane + 1 }}
                data={{
                  "data-before": seg.before ? "" : undefined,
                  "data-after": seg.after ? "" : undefined,
                  "data-on-day":
                    seg.item.startDate <= current && seg.item.endDate >= current ? "" : undefined,
                }}
              />
            ))}
          </div>
        ) : null}
        <section
          className="t-calendar-view-scroll"
          ref={scroller}
          aria-label={t("calendarHours")}
          // biome-ignore lint/a11y/noNoninteractiveTabindex: a box that scrolls takes the focus, so the keyboard can scroll it.
          tabIndex={0}
        >
          <div className="t-calendar-view-hours" aria-hidden="true">
            {Array.from({ length: 24 }, (_, hour) => (
              <span key={String(hour)}>{hour === 0 ? "" : formatHour(hour, locale)}</span>
            ))}
          </div>
          {days.map((iso) => (
            // biome-ignore lint/a11y/noStaticElementInteractions lint/a11y/useKeyWithClickEvents: a click on a free time is a pointer shortcut; Enter on a day in the month does the same.
            <div
              className="t-calendar-view-col"
              key={iso}
              data-today={iso === today ? "" : undefined}
              data-selected={iso === current ? "" : undefined}
              onClick={(e) => pickSlot(iso, e)}
            >
              {layoutDay(eventsOn(items, iso)).map((block) => (
                <EventItem
                  key={block.item.event.id}
                  item={block.item}
                  locale={locale}
                  onSelect={selectEvent}
                  geometry={{
                    "--t-top": block.top,
                    "--t-len": block.length,
                    "--t-column": block.column,
                    "--t-columns": block.columns,
                  }}
                  time={timeText(block.item, texts(), locale)}
                />
              ))}
              {iso === today ? (
                <span className="t-calendar-view-now" ref={vars({ "--t-top": nowMinutes })} />
              ) : null}
            </div>
          ))}
        </section>
      </div>
    );
  };

  const renderAgenda = () => {
    const { first, last } = periodRange("agenda", current, weekStart);
    const byDay: { iso: string; items: Placed<CalendarEvent>[] }[] = [];
    for (let iso = first; iso <= last; iso = addDays(iso, 1)) {
      const dayItems = eventsOn(items, iso);
      if (dayItems.length > 0) byDay.push({ iso, items: dayItems });
    }
    if (byDay.length === 0) return <p className="t-calendar-view-empty">{t("calendarNoEvents")}</p>;
    return (
      <div className="t-calendar-view-agenda">
        {byDay.map(({ iso, items: dayItems }) => (
          <section
            className="t-calendar-view-agenda-day"
            key={iso}
            aria-labelledby={`${titleId}-${iso}`}
            data-today={iso === today ? "" : undefined}
          >
            <h3 className="t-calendar-view-agenda-title" id={`${titleId}-${iso}`}>
              {formatDayLong(iso, locale)}
            </h3>
            <AgendaList items={dayItems} locale={locale} onSelect={selectEvent} />
          </section>
        ))}
      </div>
    );
  };

  const popItems = popDay ? eventsOn(items, popDay.iso) : [];

  return (
    <section className="t-calendar-view" ref={root} aria-label={label} data-view={shownView}>
      <div className="t-calendar-view-header">
        <div className="t-calendar-view-nav">
          <Button
            size="sm"
            variant="ghost"
            icon={<Glyph body={chevronLeft} />}
            label={t("previous")}
            onClick={() => setDate(shiftDate(shownView, current, -1))}
          />
          <Button size="sm" onClick={() => setDate(today)}>
            {t("today")}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            icon={<Glyph body={chevronRight} />}
            label={t("next")}
            onClick={() => setDate(shiftDate(shownView, current, 1))}
          />
        </div>
        <h2 className="t-calendar-view-title" id={titleId} aria-live="polite">
          {title}
        </h2>
        <Segmented
          label={t("calendarView")}
          size="sm"
          value={shownView}
          onValueChange={setView}
          options={[
            { value: "month", label: t("calendarMonth") },
            { value: "week", label: t("calendarWeek") },
            { value: "agenda", label: t("calendarAgenda") },
          ]}
        />
      </div>
      {shownView === "month" ? renderMonth() : shownView === "week" ? renderWeek() : renderAgenda()}
      <Popover.Root open={popDay !== null} onOpenChange={(open) => (open ? undefined : setPopDay(null))}>
        <Popover.Portal>
          <Popover.Positioner
            className="t-popup-positioner"
            anchor={popDay?.anchor}
            side="bottom"
            align="start"
            sideOffset={4}
          >
            <Popover.Popup
              className="t-popup t-popover t-calendar-view-popup"
              finalFocus={popDay ? { current: popDay.anchor } : true}
            >
              <Popover.Title className="t-popover-title">
                {popDay ? formatDayLong(popDay.iso, locale) : ""}
              </Popover.Title>
              <Popover.Close className="t-popover-close" aria-label={t("close")}>
                <Glyph body={close} />
              </Popover.Close>
              <div className="t-popover-body">
                <AgendaList
                  items={popItems}
                  locale={locale}
                  onSelect={(event) => {
                    setPopDay(null);
                    onSelectEvent?.(event);
                  }}
                />
              </div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </section>
  );
}
