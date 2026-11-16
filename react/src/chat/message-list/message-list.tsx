import { Toolbar } from "@base-ui/react/toolbar";
import { arrowDown, danger, file, retry } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import {
  atEnd,
  atStart,
  countAppended,
  formatClock,
  formatDay,
  layout,
  nextScrollTop,
} from "@tailor/packs/chat/message-list/logic";
import type spec from "@tailor/packs/chat/message-list/spec";
import { toDate } from "@tailor/packs/core/relative-time/logic";
import { type ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Avatar } from "../../core/avatar/avatar";
import { Badge } from "../../core/badge/badge";
import { Button } from "../../core/button/button";
import { RelativeTime } from "../../core/relative-time/relative-time";
import { Glyph } from "../../glyph";
import { Markdown } from "../../markdown/markdown/markdown";

export interface MessageAttachment {
  /** The file name. */
  name: string;
  /** Where the file opens. Without one, the name shows as text. */
  href?: string;
}

export interface MessageAction {
  /** The accessible name of the button, also its tooltip-free label. */
  label: string;
  /** The icon of the button, e.g. `<Icon name="bi:copy" />`. */
  icon: ReactNode;
  onSelect: () => void;
}

export interface Message {
  id: string;
  /** "self": the user of the page. "other": anyone else. "system": a line about the conversation. */
  role: (typeof spec.props.role)[number];
  author?: { name: string; avatarSrc?: string };
  /** An ISO date-time string or a Date. */
  time?: string | Date;
  /** The text, as Markdown. While it streams, the part that arrived so far. */
  text: string;
  /** "sending": not yet confirmed. "streaming": the text is still arriving. "failed": it could not be sent. */
  state?: (typeof spec.props.state)[number];
  attachments?: readonly MessageAttachment[];
  /** Buttons for the message: copy, edit, react. */
  actions?: readonly MessageAction[];
}

export interface MessageListProps {
  /** The accessible name of the transcript. */
  label: string;
  /** The messages, oldest first. */
  messages: readonly Message[];
  /** Draws the content of a message in place of the Markdown text. */
  renderMessage?: (message: Message) => ReactNode;
  /** Shows "Try again" on a failed message. */
  onRetry?: (id: string) => void;
  /** Called when the user reaches the top edge (the oldest end): load older messages and put them first. */
  onEndReached?: () => void;
  /** "hover": the time shows on hover and focus (always on a touch screen). "always": it always shows. */
  times?: (typeof spec.props.times)[number];
  /** "clock": "2:30 PM". "relative": "5 minutes ago". */
  timeFormat?: (typeof spec.props.timeFormat)[number];
  locale?: string;
}

interface ScrollState {
  pinned: boolean;
  atStart: boolean;
  anchorId: string | null;
  anchorOffset: number | null;
  ids: readonly string[];
  /** The position the list scrolled to itself; its scroll event is not the user's. */
  ownTop: number | null;
}

/** The transcript of a conversation. It fills its parent, scrolls by itself and keeps to the end while text arrives. */
export function MessageList({
  label,
  messages,
  renderMessage,
  onRetry,
  onEndReached,
  times = "hover",
  timeFormat = "clock",
  locale,
}: MessageListProps) {
  const log = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const scroll = useRef<ScrollState>({
    pinned: true,
    atStart: false,
    anchorId: null,
    anchorOffset: null,
    ids: [],
    ownTop: null,
  });
  const endReached = useRef(onEndReached);
  endReached.current = onEndReached;
  const [unread, setUnread] = useState(0);

  const placed = useMemo(
    () =>
      layout(
        messages.map((m) => ({ role: m.role, author: m.author?.name, time: m.time ? toDate(m.time) : null })),
      ),
    [messages],
  );

  const item = useCallback(
    (id: string): HTMLElement | null =>
      inner.current?.querySelector<HTMLElement>(`[data-message-id="${CSS.escape(id)}"]`) ?? null,
    [],
  );

  /** Notes where the view is: at the end or not, and the first message in sight with its distance from the top. */
  const record = useCallback((): void => {
    const element = log.current;
    if (!element) return;
    const s = scroll.current;
    s.pinned = atEnd(element);
    const top = element.getBoundingClientRect().top;
    s.anchorId = null;
    s.anchorOffset = null;
    for (const node of element.querySelectorAll<HTMLElement>("[data-message-id]")) {
      const box = node.getBoundingClientRect();
      // The first message that starts in sight: a message above it that grows does not move it.
      if (box.top >= top - 1) {
        s.anchorId = node.dataset.messageId ?? null;
        s.anchorOffset = box.top - top;
        break;
      }
    }
    if (s.pinned) setUnread(0);
    const start = atStart(element);
    if (start && !s.atStart) endReached.current?.();
    s.atStart = start;
  }, []);

  /** After the content changed: back to the end when pinned, otherwise the message in sight stays in place. */
  const adjust = useCallback((): void => {
    const element = log.current;
    if (!element) return;
    const s = scroll.current;
    const anchor = s.anchorId ? item(s.anchorId) : null;
    const next = nextScrollTop(
      { pinned: s.pinned, anchorOffset: s.anchorOffset },
      {
        scrollTop: element.scrollTop,
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight,
        anchorOffset: anchor
          ? anchor.getBoundingClientRect().top - element.getBoundingClientRect().top
          : null,
      },
    );
    if (next !== null) {
      element.scrollTop = next;
      scroll.current.ownTop = element.scrollTop;
    }
    record();
  }, [item, record]);

  useLayoutEffect(() => {
    const s = scroll.current;
    const ids = messages.map((m) => m.id);
    const added = countAppended(s.ids, ids);
    s.ids = ids;
    // A message the user sent brings the view to the end; anything else while scrolled up counts as new.
    if (messages.slice(messages.length - added).some((m) => m.role === "self")) s.pinned = true;
    else if (!s.pinned && added > 0) setUnread((count) => count + added);
    adjust();
  }, [messages, adjust]);

  // Text that renders late, images that load and a view that changes size go through the same decision.
  useEffect(() => {
    const element = log.current;
    const content = inner.current;
    if (!element || !content) return;
    const observer = new ResizeObserver(() => adjust());
    observer.observe(element);
    observer.observe(content);
    return () => observer.disconnect();
  }, [adjust]);

  const jump = (): void => {
    const element = log.current;
    if (!element) return;
    element.scrollTop = element.scrollHeight;
    element.focus({ preventScroll: true });
    record();
  };

  const now = new Date();
  return (
    <div className="t-messages" data-times={times === "hover" ? undefined : times}>
      <div
        ref={log}
        className="t-messages-log"
        role="log"
        aria-live="polite"
        aria-label={label}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: a box that scrolls takes the focus, so the keyboard can scroll it.
        tabIndex={0}
        onScroll={(event) => {
          // The event of the list's own scroll can come after the content grew again: the next adjust handles that.
          const own = scroll.current.ownTop;
          scroll.current.ownTop = null;
          if (own === null || Math.abs(event.currentTarget.scrollTop - own) >= 1) record();
        }}
      >
        <div ref={inner} className="t-messages-inner">
          {messages.map((message, index) => {
            const place = placed[index];
            if (!place) return null;
            const date = message.time ? toDate(message.time) : null;
            return (
              <MessageItem
                key={message.id}
                message={message}
                date={date}
                day={place.day ? formatDay(place.day, now, t("today"), locale) : null}
                groupStart={place.groupStart}
                renderMessage={renderMessage}
                onRetry={onRetry}
                timeFormat={timeFormat}
                locale={locale}
              />
            );
          })}
        </div>
      </div>
      {unread > 0 ? (
        <div className="t-messages-jump">
          <Button size="sm" icon={<Glyph body={arrowDown} />} onClick={jump}>
            {t("chatNewMessages")} <Badge tone="accent">{unread}</Badge>
          </Button>
        </div>
      ) : null}
    </div>
  );
}

interface MessageItemProps {
  message: Message;
  date: Date | null;
  day: string | null;
  groupStart: boolean;
  renderMessage?: (message: Message) => ReactNode;
  onRetry?: (id: string) => void;
  timeFormat: (typeof spec.props.timeFormat)[number];
  locale?: string;
}

function MessageItem({
  message,
  date,
  day,
  groupStart,
  renderMessage,
  onRetry,
  timeFormat,
  locale,
}: MessageItemProps) {
  const { id, role, author, state, attachments, actions } = message;
  const name = author?.name ?? (role === "self" ? t("chatYou") : undefined);
  const clock = date ? formatClock(date, locale) : undefined;
  const accessibleName = [name, clock].filter(Boolean).join(", ") || undefined;

  const time =
    state === "sending" ? (
      <span className="t-messages-time">{t("chatSending")}</span>
    ) : date ? (
      <span className="t-messages-time">
        {timeFormat === "relative" ? (
          <RelativeTime date={date} locale={locale} />
        ) : (
          <time dateTime={date.toISOString()}>{clock}</time>
        )}
      </span>
    ) : null;

  return (
    <>
      {day ? (
        <div className="t-messages-day">
          <span>{day}</span>
        </div>
      ) : null}
      <article
        className="t-messages-item"
        data-message-id={id}
        data-role={role}
        data-state={state}
        data-group-start={groupStart ? "" : undefined}
        aria-label={accessibleName}
        aria-busy={state === "streaming" ? true : undefined}
      >
        {role === "other" ? (
          <span className="t-messages-avatar">
            {groupStart && name ? <Avatar name={name} src={author?.avatarSrc} size="sm" /> : null}
          </span>
        ) : null}
        <div className="t-messages-body">
          {role === "other" && groupStart && name ? (
            <span className="t-messages-author" aria-hidden="true">
              {name}
            </span>
          ) : null}
          <div className="t-messages-row">
            <div className="t-messages-bubble">
              {renderMessage ? renderMessage(message) : <Markdown source={message.text} />}
              {state === "streaming" ? <span className="t-messages-activity" aria-hidden="true" /> : null}
            </div>
            {time}
          </div>
          {attachments && attachments.length > 0 ? (
            <ul className="t-messages-files" aria-label={t("chatAttachment")}>
              {attachments.map((a) => (
                <li key={a.name}>
                  <Glyph body={file} />
                  {a.href ? <a href={a.href}>{a.name}</a> : <span>{a.name}</span>}
                </li>
              ))}
            </ul>
          ) : null}
          {state === "failed" ? (
            <div className="t-messages-failed">
              <Glyph body={danger} />
              <span>{t("chatFailed")}</span>
              {onRetry ? (
                <Button size="sm" variant="ghost" icon={<Glyph body={retry} />} onClick={() => onRetry(id)}>
                  {t("retry")}
                </Button>
              ) : null}
            </div>
          ) : null}
          {actions && actions.length > 0 ? (
            <Toolbar.Root className="t-messages-actions" aria-label={t("chatMessageActions")}>
              {actions.map((action) => (
                <Toolbar.Button
                  key={action.label}
                  className="t-btn"
                  data-variant="ghost"
                  data-size="sm"
                  data-icon-only=""
                  aria-label={action.label}
                  onClick={action.onSelect}
                >
                  {action.icon}
                </Toolbar.Button>
              ))}
            </Toolbar.Root>
          ) : null}
        </div>
      </article>
    </>
  );
}

export interface ChatViewProps {
  /** The transcript. */
  messages: ReactNode;
  /** The notices above the composer. */
  notices?: ReactNode;
  /** The composer. */
  composer: ReactNode;
}

/** The standard arrangement: the transcript, the notices and the composer in a column that fills its parent. */
export function ChatView({ messages, notices, composer }: ChatViewProps) {
  return (
    <div className="t-messages-chat">
      {messages}
      {notices}
      {composer}
    </div>
  );
}
