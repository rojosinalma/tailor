/** The logic of the composer, shared by both kits. Plain TypeScript, no DOM. */

export interface KeyInput {
  readonly key: string;
  readonly shiftKey: boolean;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly altKey: boolean;
  /** An input method (IME) is composing text: its Enter confirms the text. */
  readonly isComposing: boolean;
  /** The device has a coarse pointer: Enter makes a new line and the send button sends. */
  readonly coarse: boolean;
}

/** Enter sends; Shift+Enter, Enter on a touch screen and Enter during composition make a new line. */
export const sendsOnKey = (k: KeyInput): boolean =>
  k.key === "Enter" && !k.shiftKey && !k.altKey && !k.isComposing && (!k.coarse || k.ctrlKey || k.metaKey);

/** Text that is only white space cannot be sent; files alone can. */
export const canSend = (text: string, files: number): boolean => text.trim() !== "" || files > 0;

/**
 * Whether a file matches an `accept` list like the file chooser's: ".pdf", "image/*", "text/plain".
 * An empty list accepts every file.
 */
export function accepts(file: { readonly name: string; readonly type: string }, accept?: string): boolean {
  const rules = (accept ?? "")
    .split(",")
    .map((r) => r.trim().toLowerCase())
    .filter(Boolean);
  if (rules.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return rules.some((rule) => {
    if (rule.startsWith(".")) return name.endsWith(rule);
    if (rule.endsWith("/*")) return type.startsWith(rule.slice(0, -1));
    return type === rule;
  });
}

/** The share of the limit from where the character count shows. */
const COUNT_FROM = 0.8;

export const showsCount = (length: number, max?: number): boolean =>
  max !== undefined && max > 0 && length >= max * COUNT_FROM;
