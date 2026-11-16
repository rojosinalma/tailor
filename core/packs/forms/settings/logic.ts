/** The rules of the settings page that both kits share. */

/** The save state of one setting. */
export type SaveState = "idle" | "saving" | "saved" | "failed";

/** How long the check of a saved setting stays, in milliseconds. */
export const SAVED_FOR = 2000;

/** The pause after the last key before a text setting saves, in milliseconds. */
export const TEXT_DELAY = 800;

/**
 * The section in view: the last one whose top has reached the line near the top of the scroll box, or the last
 * section when the box is scrolled to its end. `tops` are the tops of the sections, in page order.
 */
export function activeIndex(tops: readonly number[], line: number, atEnd: boolean): number {
  if (tops.length === 0) return -1;
  if (atEnd) return tops.length - 1;
  let active = 0;
  tops.forEach((top, index) => {
    if (top <= line) active = index;
  });
  return active;
}

/** The outcome of a save: no answer or `{ ok: true }` saved; `{ ok: false }` or anything else did not. */
export function saveOutcome(answer: unknown): { ok: boolean; message?: string } {
  if (answer === undefined) return { ok: true };
  if (typeof answer !== "object" || answer === null || !("ok" in answer)) return { ok: false };
  const message = "message" in answer && typeof answer.message === "string" ? answer.message : undefined;
  return { ok: answer.ok === true, message };
}
