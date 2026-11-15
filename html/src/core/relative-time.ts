import { t } from "@tailor/core/text";
import {
  formatFull,
  formatRelative,
  nextUpdate,
  subscribe,
  toDate,
} from "@tailor/packs/core/relative-time/logic";
import { register } from "../runtime";

/** Keeps a <time data-t="relative-time" datetime="…"> up to date on the one shared timer. */
register("relative-time", (element) => {
  if (!(element instanceof HTMLTimeElement)) return;
  const date = toDate(element.dateTime);
  if (!date) return;
  const locale = element.dataset.locale || undefined;
  const paint = (now: Date): number => {
    element.textContent = formatRelative(date, now, t("justNow"), locale);
    element.setAttribute("aria-label", formatFull(date, locale));
    return nextUpdate(date, now);
  };
  const stop = subscribe(() => {
    // An element that left the page stops; the timer ends with the last one.
    if (!element.isConnected) {
      stop();
      return 0;
    }
    return paint(new Date());
  }, paint(new Date()));
});
