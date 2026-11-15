import { t } from "@tailor/core/text";
import {
  formatFull,
  formatRelative,
  nextUpdate,
  subscribe,
  toDate,
} from "@tailor/packs/core/relative-time/logic";
import { useEffect, useState } from "react";
import { useIsStatic } from "../../kit";

export interface RelativeTimeProps {
  /** An ISO date-time string or a Date. */
  date: string | Date;
  locale?: string;
}

/** "2 hours ago", "in 3 days" or "just now", kept up to date. The full date is its accessible name. */
export function RelativeTime({ date, locale }: RelativeTimeProps) {
  const isStatic = useIsStatic();
  const parsed = toDate(date);
  const time = parsed?.getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (time === undefined) return;
    const target = new Date(time);
    return subscribe(
      () => {
        const current = new Date();
        setNow(current.getTime());
        return nextUpdate(target, current);
      },
      nextUpdate(target, new Date()),
    );
  }, [time]);

  // A value that is not a time shows as it came.
  if (!parsed) return <time className="t-time">{String(date)}</time>;
  return (
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: browsers map <time> to the role "time", which takes a name: the full date.
    <time
      className="t-time"
      dateTime={parsed.toISOString()}
      aria-label={formatFull(parsed, locale)}
      data-t={isStatic ? "relative-time" : undefined}
      data-locale={isStatic ? locale : undefined}
    >
      {formatRelative(parsed, new Date(now), t("justNow"), locale)}
    </time>
  );
}
