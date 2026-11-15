/** The swipe that closes a bottom drawer. Plain maths, shared by both kits. */

/** How far the sheet follows the pointer: down only. */
export const swipeOffset = (startY: number, y: number): number => Math.max(0, y - startY);

/** A downward swipe closes the sheet when it travels at least a third of the sheet's height. */
export const swipeCloses = (offset: number, height: number): boolean => height > 0 && offset >= height / 3;
