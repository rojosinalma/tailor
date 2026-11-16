import { arrowDown, check, copy } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import {
  detectLevel,
  LEVEL_TONE,
  type Level,
  markMatches,
  matchesQuery,
  parseAnsi,
  type Segment,
  stripAnsi,
} from "@tailor/packs/data/log-view/logic";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Button } from "../../core/button/button";
import { Search } from "../../core/search/search";
import { Switch } from "../../core/switch/switch";
import { Glyph } from "../../glyph";
import { useIsStatic } from "../../kit";

export interface LogLine {
  /** Unique and stable: new lines get new ids. */
  readonly id: string;
  /** Shown as it comes, such as "10:00:01". */
  readonly time?: string;
  /** Shown as a word; without it, the line is toned by a level word in its text. */
  readonly level?: Level;
  /** May hold ANSI colour codes. */
  readonly text: string;
}

export interface LogViewProps {
  /** The accessible name of the log. */
  label: string;
  /** The id of the log, for a button that appends a line in the HTML kit (data-t-append="#id"). */
  id?: string;
  lines: readonly LogLine[];
  /** Starts with follow on: the view keeps the end in sight while lines arrive. */
  follow?: boolean;
  /** Wraps long lines; without it the view scrolls sideways. */
  wrap?: boolean;
  /** Keeps only the last lines. */
  maxLines?: number;
}

const ESTIMATE = 21;
/** Up to this many shown lines every line renders: then the box scrolls exactly as the HTML kit's does. */
const FLAT_MAX = 300;
const COPIED_MS = 1500;
/** How near the end, in px, still counts as at the end. */
const END_SLACK = 4;

interface Shown {
  readonly line: LogLine;
  readonly plain: string;
  readonly level?: Level;
}

function Runs({ segments }: { segments: readonly Segment[] }) {
  return segments.map((s, i) =>
    s.mark ? (
      // biome-ignore lint/suspicious/noArrayIndexKey: the runs of a line never move.
      <mark key={i} className="t-log-mark">
        {s.text}
      </mark>
    ) : s.fg || s.bold || s.dim ? (
      // biome-ignore lint/suspicious/noArrayIndexKey: the runs of a line never move.
      <span key={i} data-fg={s.fg} data-bold={s.bold ? "" : undefined} data-dim={s.dim ? "" : undefined}>
        {s.text}
      </span>
    ) : (
      s.text
    ),
  );
}

function Line({ shown, query }: { shown: Shown; query: string }) {
  const { line } = shown;
  return (
    <>
      {line.time ? <span className="t-log-time">{line.time}</span> : null}
      {line.level ? <span className="t-log-level">{line.level.toUpperCase()}</span> : null}
      <span className="t-log-text">
        <Runs segments={markMatches(parseAnsi(line.text), query)} />
      </span>
    </>
  );
}

/** A log that fills its parent, with follow, a filter, copy and ANSI colours. Only the lines in view render. */
export function LogView({
  label,
  id,
  lines,
  follow: startFollow = true,
  wrap = false,
  maxLines = 2000,
}: LogViewProps) {
  const isStatic = useIsStatic();
  const kept = useMemo(() => (lines.length > maxLines ? lines.slice(-maxLines) : lines), [lines, maxLines]);
  const all = useMemo(
    () =>
      kept.map((line): Shown => {
        const plain = stripAnsi(line.text);
        return { line, plain, level: line.level ?? detectLevel(plain) };
      }),
    [kept],
  );

  if (isStatic)
    return (
      <ol
        className="t-log"
        id={id}
        data-t="log"
        aria-label={label}
        data-wrap={wrap ? "" : undefined}
        data-follow={startFollow ? undefined : "off"}
        data-max-lines={maxLines === 2000 ? undefined : maxLines}
      >
        {kept.map((line) => (
          <li key={line.id} data-level={line.level} data-time={line.time}>
            {line.text}
          </li>
        ))}
      </ol>
    );
  return <LiveLog label={label} id={id} all={all} startFollow={startFollow} wrap={wrap} />;
}

function LiveLog({
  label,
  id,
  all,
  startFollow,
  wrap,
}: {
  label: string;
  id?: string;
  all: readonly Shown[];
  startFollow: boolean;
  wrap: boolean;
}) {
  const [query, setQuery] = useState("");
  const [follow, setFollow] = useState(startFollow);
  const [copied, setCopied] = useState(false);
  const view = useRef<HTMLElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const lastTop = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const shown = useMemo(() => all.filter((s) => matchesQuery(s.plain, query)), [all, query]);
  const flat = shown.length <= FLAT_MAX;
  // A line that does not wrap is one line high: the skin's line height is the exact estimate.
  const [estimate, setEstimate] = useState(ESTIMATE);
  const virtual = useVirtualizer({
    count: flat ? 0 : shown.length,
    getScrollElement: () => view.current,
    estimateSize: () => estimate,
    overscan: 12,
    // The exact height: a rounded one adds up to a gap over many rows of fractional height.
    measureElement: (element) => element.getBoundingClientRect().height,
    getItemKey: (index) => shown[index]?.line.id ?? index,
  });
  const rows = flat
    ? shown.map((item, index) => ({ key: item.line.id, index, start: 0 }))
    : virtual.getVirtualItems();
  const total = virtual.getTotalSize();
  const offset = rows[0]?.start ?? 0;

  useLayoutEffect(() => {
    const height = list.current ? Number.parseFloat(getComputedStyle(list.current).lineHeight) : 0;
    if (height > 0) setEstimate(height);
  }, []);
  useLayoutEffect(() => {
    if (estimate !== ESTIMATE) virtual.measure();
  }, [estimate, virtual]);

  useLayoutEffect(() => {
    const style = list.current?.style;
    if (!style) return;
    if (flat) {
      style.removeProperty("--t-log-size");
      style.removeProperty("--t-log-offset");
      return;
    }
    style.setProperty("--t-log-size", `${total}px`);
    style.setProperty("--t-log-offset", `${offset}px`);
  }, [flat, total, offset]);

  // While following, every change of the lines or of their sizes keeps the end in view.
  useLayoutEffect(() => {
    const el = view.current;
    if (!follow || !el) return;
    el.scrollTop = el.scrollHeight;
    lastTop.current = el.scrollTop;
  });

  // A later layout (a font, the size of the box) moves the end: while following, the view keeps it in sight.
  const following = useRef(follow);
  following.current = follow;
  useEffect(() => {
    const [el, ol] = [view.current, list.current];
    if (!el || !ol) return;
    const observer = new ResizeObserver(() => {
      // A skin with another line height: the sizes of the lines out of view are stale until measured again.
      const height = Number.parseFloat(getComputedStyle(ol).lineHeight);
      if (height > 0) setEstimate(height);
      if (!following.current) return;
      el.scrollTop = el.scrollHeight;
      lastTop.current = el.scrollTop;
    });
    observer.observe(el);
    observer.observe(ol);
    return () => observer.disconnect();
  }, []);

  const onScroll = (): void => {
    const el = view.current;
    if (!el) return;
    const atEnd = el.scrollHeight - el.scrollTop - el.clientHeight <= END_SLACK;
    // Scrolling up, away from the end, is the user's: follow stops.
    if (follow && !atEnd && el.scrollTop < lastTop.current) setFollow(false);
    lastTop.current = el.scrollTop;
  };

  const onCopy = (): void => {
    const text = shown
      .map(({ line, plain }) => [line.time, line.level?.toUpperCase(), plain].filter(Boolean).join(" "))
      .join("\n");
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), COPIED_MS);
      },
      // Without clipboard access the button stays as it is.
      () => undefined,
    );
  };

  return (
    <div className="t-log" id={id} data-wrap={wrap ? "" : undefined}>
      <div className="t-log-bar">
        <Search
          label={t("filter")}
          placeholder={t("filter")}
          size="sm"
          shortcut={false}
          value={query}
          onValueChange={setQuery}
        />
        <Switch label={t("follow")} checked={follow} onCheckedChange={setFollow} />
        <Button size="sm" variant="ghost" icon={<Glyph body={copied ? check : copy} />} onClick={onCopy}>
          <span aria-live="polite">{copied ? t("copied") : t("copy")}</span>
        </Button>
      </div>
      <section
        className="t-log-view"
        aria-label={label}
        ref={view}
        onScroll={onScroll}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: the lines scroll, so the keyboard needs to reach them.
        tabIndex={0}
      >
        <ol className="t-log-lines" ref={list}>
          {rows.map((row) => {
            const item = shown[row.index];
            if (!item) return null;
            return (
              <li
                key={row.key}
                className="t-log-line"
                data-index={row.index}
                data-level={item.level}
                data-tone={item.level ? LEVEL_TONE[item.level] : undefined}
                ref={flat ? undefined : virtual.measureElement}
              >
                <Line shown={item} query={query} />
              </li>
            );
          })}
        </ol>
      </section>
      {follow ? null : (
        <Button
          className="t-log-jump"
          size="sm"
          variant="primary"
          icon={<Glyph body={arrowDown} />}
          onClick={() => {
            setFollow(true);
            view.current?.focus();
          }}
        >
          {t("jumpToEnd")}
        </Button>
      )}
    </div>
  );
}
