// Data display: badge, counter, chip, state-label, status-dot, avatar, table,
// card, empty-state, timeline, relative-time — markup per core/components.json.
import {
  createContext, useContext, useEffect, useState,
  type HTMLAttributes, type ImgHTMLAttributes,
  type ReactNode, type TdHTMLAttributes, type ThHTMLAttributes, type TimeHTMLAttributes,
} from "react";
import { iconSlot } from "./actions.tsx";
import { cx, dataAttr, type Size, type Tone } from "./util.ts";

/* ── badge / counter / chip ──────────────────────────────────────────────── */

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone;
  variant?: "tint" | "solid" | "outline";
  size?: "xs" | "sm" | "lg";
};

export function Badge({ tone, variant, size, className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cx("t-badge", className)}
      data-tone={dataAttr(tone)}
      data-variant={dataAttr(variant)}
      data-size={dataAttr(size)}
      {...rest}
    >
      {children}
    </span>
  );
}

type CounterProps = HTMLAttributes<HTMLSpanElement> & { tone?: Tone };

export function Counter({ tone, className, children, ...rest }: CounterProps) {
  return <span className={cx("t-counter", className)} data-tone={dataAttr(tone)} {...rest}>{children}</span>;
}

type ChipProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone;
  /** Renders a trailing × remove button with this accessible label. */
  onRemove?: () => void;
  removeLabel?: string;
};

export function Chip({ tone, onRemove, removeLabel, className, children, ...rest }: ChipProps) {
  return (
    <span className={cx("t-chip", className)} data-tone={dataAttr(tone)} {...rest}>
      {children}
      {onRemove && (
        <button className="t-chip-remove" aria-label={removeLabel} onClick={onRemove}>×</button>
      )}
    </span>
  );
}

/* ── state label / status dot ────────────────────────────────────────────── */

type StateLabelProps = HTMLAttributes<HTMLSpanElement> & {
  state: "open" | "closed" | "done" | "draft" | "warning" | "info";
  variant?: "solid";
  size?: "sm";
  /** A string is a sprite icon name; a node renders as-is. */
  icon?: ReactNode;
};

export function StateLabel({ state, variant, size, icon, className, children, ...rest }: StateLabelProps) {
  return (
    <span
      className={cx("t-state", className)}
      data-state={state}
      data-variant={dataAttr(variant)}
      data-size={dataAttr(size)}
      {...rest}
    >
      {iconSlot(icon)}
      {children}
    </span>
  );
}

type DotProps = Omit<HTMLAttributes<HTMLSpanElement>, "title"> & {
  status: "running" | "degraded" | "stopped" | "muted";
  /** Tooltip text (`data-tip`; never `title=`). */
  tip?: string;
};

export function Dot({ status, tip, className, ...rest }: DotProps) {
  return <span className={cx("t-dot", className)} data-status={status} data-tip={tip} {...rest}></span>;
}

/* ── avatar ──────────────────────────────────────────────────────────────── */

type AvatarProps = (HTMLAttributes<HTMLSpanElement> & ImgHTMLAttributes<HTMLImageElement>) & {
  size?: Size;
  shape?: "square";
  tone?: Tone;
  /** Overflow avatar in a stack (`data-more`), e.g. children "+3". */
  more?: boolean;
  /** Image avatar. */
  src?: string;
  /** Status dot bottom-right; wraps in `.t-avatar-wrap`. */
  status?: "online" | "busy" | "offline";
};

export function Avatar({ size, shape, tone, more, src, status, className, children, alt, ...rest }: AvatarProps) {
  const avatar = src !== undefined
    ? <img className={cx("t-avatar", className)} data-size={dataAttr(size, "md")} data-shape={dataAttr(shape)} src={src} alt={alt ?? ""} {...rest} />
    : (
      <span
        className={cx("t-avatar", className)}
        data-size={dataAttr(size, "md")}
        data-shape={dataAttr(shape)}
        data-tone={dataAttr(tone)}
        data-more={more ? "" : undefined}
        {...rest}
      >
        {children}
      </span>
    );
  if (!status) return avatar;
  return (
    <span className="t-avatar-wrap">
      {avatar}
      <span className="t-avatar-status" data-status={status}></span>
    </span>
  );
}

function AvatarStack({ className, children, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cx("t-avatar-stack", className)} {...rest}>{children}</span>;
}

type AvatarRowProps = HTMLAttributes<HTMLSpanElement> & { name: ReactNode; desc?: ReactNode };

function AvatarRow({ name, desc, className, children, ...rest }: AvatarRowProps) {
  return (
    <span className={cx("t-avatar-row", className)} {...rest}>
      {children}
      <span>
        <span className="t-avatar-name">{name}</span>
        {desc !== undefined && <span className="t-avatar-desc">{desc}</span>}
      </span>
    </span>
  );
}

Avatar.Stack = AvatarStack;
Avatar.Row = AvatarRow;

/* ── table ───────────────────────────────────────────────────────────────── */

type TableProps = HTMLAttributes<HTMLTableElement> & {
  variant?: "data" | "log";
  density?: "compact";
};

export function Table({ variant, density, className, children, ...rest }: TableProps) {
  return (
    <table className={cx("t-table", className)} data-variant={dataAttr(variant)} data-density={dataAttr(density)} {...rest}>
      {children}
    </table>
  );
}

function TableWrap({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("t-table-wrap", className)} {...rest}>{children}</div>;
}

export type SortDir = "ascending" | "descending" | "none";

type ThProps = ThHTMLAttributes<HTMLTableCellElement> & {
  /** Sort key (`data-sort`); renders the header as a sort button. */
  sort?: string;
  dir?: SortDir;
  onSort?: (key: string, dir: Exclude<SortDir, "none">) => void;
  /** Right-aligned numeric column. */
  num?: boolean;
  /** Icon-only / actions columns. */
  icon?: boolean;
  actions?: boolean;
};

function Th({ sort, dir, onSort, num, icon, actions, className, children, ...rest }: ThProps) {
  const cls = cx(num && "t-col-num", icon && "t-col-icon", actions && "t-col-actions", className) || undefined;
  if (sort === undefined) return <th className={cls} {...rest}>{children}</th>;
  const next: Exclude<SortDir, "none"> = dir === "ascending" ? "descending" : "ascending";
  return (
    <th className={cls} aria-sort={dir} data-sort={sort} {...rest}>
      <button onClick={() => onSort?.(sort, next)}>
        {children} <span className="t-sort-icon"></span>
      </button>
    </th>
  );
}

type TdProps = TdHTMLAttributes<HTMLTableCellElement> & {
  num?: boolean;
  icon?: boolean;
  actions?: boolean;
};

function Td({ num, icon, actions, className, children, ...rest }: TdProps) {
  const cls = cx(num && "t-col-num", icon && "t-col-icon", actions && "t-col-actions", className) || undefined;
  return <td className={cls} {...rest}>{children}</td>;
}

type TableGroupProps = HTMLAttributes<HTMLTableRowElement> & { colSpan: number };

function TableGroup({ colSpan, className, children, ...rest }: TableGroupProps) {
  return (
    <tr className={cx("t-table-group", className)} {...rest}>
      <td colSpan={colSpan}>{children}</td>
    </tr>
  );
}

Table.Wrap = TableWrap;
Table.Th = Th;
Table.Td = Td;
Table.Group = TableGroup;

/* ── card ────────────────────────────────────────────────────────────────── */

const CardContext = createContext<{ collapsible: boolean }>({ collapsible: false });

type CardProps = HTMLAttributes<HTMLElement> & {
  /** Space-separated combinable variants: clickable, stat, thumb. */
  variant?: string;
  /** Render as `<details data-variant="collapsible">`; Card.Header becomes the summary. */
  collapsible?: boolean;
  open?: boolean;
  selected?: boolean;
};

export function Card({ variant, collapsible, open, selected, className, children, ...rest }: CardProps) {
  const shared = {
    className: cx("t-card", className),
    "data-variant": collapsible ? "collapsible" : dataAttr(variant),
    "aria-selected": selected,
    ...rest,
  };
  if (collapsible) {
    return (
      <CardContext value={{ collapsible: true }}>
        <details {...shared} open={open}>{children}</details>
      </CardContext>
    );
  }
  return <div {...shared}>{children}</div>;
}

function CardHeader({ className, children, ...rest }: HTMLAttributes<HTMLElement>) {
  const { collapsible } = useContext(CardContext);
  if (collapsible) return <summary className={cx("t-card-header", className)} {...rest}>{children}</summary>;
  return <div className={cx("t-card-header", className)} {...rest}>{children}</div>;
}

function CardTitle({ className, children, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cx("t-card-title", className)} {...rest}>{children}</h3>;
}

/** End slot of the header: actions/hints right of the title. */
function CardTools({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("t-card-tools", className)} {...rest}>{children}</div>;
}

function CardBody({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("t-card-body", className)} {...rest}>{children}</div>;
}

type CardFooterProps = HTMLAttributes<HTMLDivElement> & { actions?: boolean };

function CardFooter({ actions, className, children, ...rest }: CardFooterProps) {
  return <div className={cx("t-card-footer", actions && "t-card-actions", className)} {...rest}>{children}</div>;
}

function CardActions({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("t-card-actions", className)} {...rest}>{children}</div>;
}

type CardThumbProps = HTMLAttributes<HTMLDivElement> & { ratio?: "square" };

function CardThumb({ ratio, className, children, ...rest }: CardThumbProps) {
  return <div className={cx("t-card-thumb", className)} data-ratio={dataAttr(ratio)} {...rest}>{children}</div>;
}

function CardMeta({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("t-card-meta", className)} {...rest}>{children}</div>;
}

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Tools = CardTools;
Card.Body = CardBody;
Card.Footer = CardFooter;
Card.Actions = CardActions;
Card.Thumb = CardThumb;
Card.Meta = CardMeta;

/** Two-column facts grid (`<dl class="t-facts">`). */
export function Facts({ className, children, ...rest }: HTMLAttributes<HTMLDListElement>) {
  return <dl className={cx("t-facts", className)} {...rest}>{children}</dl>;
}

/** Stat-card parts (card `data-variant="stat"`). */
export function StatLabel({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("t-stat-label", className)} {...rest}>{children}</div>;
}
export function StatValue({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("t-stat-value", className)} {...rest}>{children}</div>;
}
export function StatSub({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("t-stat-sub", className)} {...rest}>{children}</div>;
}
type StatBoxProps = HTMLAttributes<HTMLDivElement> & { empty?: boolean };
export function StatBox({ empty, className, children, ...rest }: StatBoxProps) {
  return <div className={cx("t-stat-box", className)} data-empty={empty ? "" : undefined} {...rest}>{children}</div>;
}

/* ── empty state ─────────────────────────────────────────────────────────── */

type EmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  /** A string is a sprite icon name; a node renders as-is. */
  icon?: ReactNode;
  title: ReactNode;
  actions?: ReactNode;
  size?: "sm";
};

export function EmptyState({ icon, title, actions, size, className, children, ...rest }: EmptyStateProps) {
  return (
    <div className={cx("t-empty", className)} data-size={dataAttr(size)} {...rest}>
      {iconSlot(icon, "t-empty-icon")}
      <h3 className="t-empty-title">{title}</h3>
      {children}
      {actions !== undefined && <div className="t-empty-actions">{actions}</div>}
    </div>
  );
}

/* ── timeline ────────────────────────────────────────────────────────────── */

export function Timeline({ className, children, ...rest }: HTMLAttributes<HTMLOListElement>) {
  return <ol className={cx("t-timeline", className)} {...rest}>{children}</ol>;
}

type TimelineItemProps = HTMLAttributes<HTMLLIElement> & {
  tone?: Tone;
  solid?: boolean;
  /** The rail badge content (an icon/glyph). */
  badge?: ReactNode;
  condensed?: boolean;
};

function TimelineItem({ tone, solid, badge, condensed, className, children, ...rest }: TimelineItemProps) {
  return (
    <li className={cx("t-timeline-item", className)} data-density={condensed ? "condensed" : undefined} {...rest}>
      <span className="t-timeline-badge" data-tone={dataAttr(tone)} data-variant={solid ? "solid" : undefined}>
        {badge}
      </span>
      <div className="t-timeline-body">{children}</div>
    </li>
  );
}

function TimelineBreak({ className, ...rest }: HTMLAttributes<HTMLLIElement>) {
  return <li className={cx("t-timeline-break", className)} {...rest}></li>;
}

function TimelineCard({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("t-timeline-card", className)} {...rest}>{children}</div>;
}

Timeline.Item = TimelineItem;
Timeline.Break = TimelineBreak;
Timeline.Card = TimelineCard;

/* ── relative time ───────────────────────────────────────────────────────── */

export function relativeTime(date: Date, now = new Date()): string {
  const s = Math.round((now.getTime() - date.getTime()) / 1000);
  const abs = Math.abs(s);
  const fmt = (n: number, unit: string) => (s >= 0 ? `${n} ${unit}${n === 1 ? "" : "s"} ago` : `in ${n} ${unit}${n === 1 ? "" : "s"}`);
  if (abs < 45) return "just now";
  if (abs < 3600) return fmt(Math.round(abs / 60), "min");
  if (abs < 86400) return fmt(Math.round(abs / 3600), "hour");
  if (abs < 30 * 86400) return fmt(Math.round(abs / 86400), "day");
  return date.toLocaleDateString();
}

type RelativeTimeProps = TimeHTMLAttributes<HTMLTimeElement> & {
  /** ISO 8601 string or Date. */
  datetime: string | Date;
};

/**
 * `<time class="t-time" data-relative>` — children are the SSR/static fallback
 * text (an absolute date); the relative text is computed after mount and
 * refreshed every minute (the React reimplementation of Tailor.times).
 */
export function RelativeTime({ datetime, className, children, ...rest }: RelativeTimeProps) {
  const date = typeof datetime === "string" ? new Date(datetime) : datetime;
  const iso = typeof datetime === "string" ? datetime : datetime.toISOString();
  const [text, setText] = useState<string | null>(null);
  useEffect(() => {
    const update = () => setText(relativeTime(date));
    update();
    const t = setInterval(update, 60_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iso]);
  return (
    <time className={cx("t-time", className)} data-relative="" dateTime={iso} {...rest}>
      {text ?? children}
    </time>
  );
}
