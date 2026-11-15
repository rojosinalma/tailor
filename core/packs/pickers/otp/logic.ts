/**
 * The code logic of the one-time code field in the HTML kit. Plain TypeScript, no DOM.
 * It follows Base UI's OTPField, which the React kit uses: the code stays contiguous, without gaps.
 */

/** The code without white space and characters that do not belong, cut to the length. */
export function normalizeCode(text: string, length: number, numeric: boolean): string {
  const kept = text.replace(/\s/g, "").replace(numeric ? /\D/g : /[^\da-z]/gi, "");
  return Array.from(kept).slice(0, length).join("");
}

/** The code after text was typed or pasted into the slot at `index`: it overwrites from there. */
export function replaceCode(
  code: string,
  index: number,
  text: string,
  length: number,
  numeric: boolean,
): string {
  const added = normalizeCode(text, length, numeric);
  return normalizeCode(`${code.slice(0, index)}${added}${code.slice(index + added.length)}`, length, numeric);
}

/** The code without the character at `index`. */
export function removeCode(code: string, index: number): string {
  return index < 0 || index >= code.length ? code : `${code.slice(0, index)}${code.slice(index + 1)}`;
}

/** The slot that a focus may land on: never past the first empty slot. */
export const slotFor = (code: string, index: number, length: number): number =>
  Math.max(0, Math.min(index, code.length, length - 1));

/** What a key does in the slot at `index`: the new code and the slot to focus; null for a key it leaves alone. */
export function codeKey(
  code: string,
  index: number,
  key: string,
  length: number,
): { code: string; focus: number } | null {
  const end = Math.min(code.length, length - 1);
  if (key === "ArrowLeft") return { code, focus: Math.max(0, index - 1) };
  if (key === "ArrowRight") return { code, focus: Math.min(end, index + 1) };
  if (key === "Home" || key === "ArrowUp") return { code, focus: 0 };
  if (key === "End" || key === "ArrowDown") return { code, focus: end };
  if (key === "Delete") return { code: removeCode(code, index), focus: index };
  if (key === "Backspace") {
    const back = Math.max(0, index - 1);
    return { code: removeCode(code, index < code.length ? index : back), focus: back };
  }
  return null;
}
