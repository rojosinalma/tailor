/** Keyboard shortcuts in their readable form: "Mod+K", "Shift+?", "G then S", "/", "Escape". */

export const MODIFIERS = ["Mod", "Ctrl", "Alt", "Shift", "Meta"] as const;
export type Modifier = (typeof MODIFIERS)[number];

/** One step of a shortcut: the modifiers and one key. */
export interface Chord {
  readonly modifiers: readonly Modifier[];
  readonly key: string;
}

const isModifier = (part: string): part is Modifier => (MODIFIERS as readonly string[]).includes(part);

/** A single letter is upper case; a named key keeps its name ("Escape", "ArrowUp"). */
const keyName = (key: string): string => (key.length === 1 ? key.toUpperCase() : key);

function parseChord(step: string, keys: string): Chord {
  // The key "+" itself ends the step with "++", or is the whole step.
  const plus = step === "+" || step.endsWith("++");
  const head = plus ? step.slice(0, -2) : step;
  const parts = head ? head.split("+") : [];
  const key = plus ? "+" : (parts.pop() ?? "");
  const modifiers = parts.filter((p) => p !== "");
  if (!key || isModifier(key) || modifiers.length !== parts.length || !modifiers.every(isModifier))
    throw new Error(`Unknown keys "${keys}": write them as "Mod+K", "Shift+?", "G then S" or "Escape"`);
  return { modifiers: MODIFIERS.filter((m) => modifiers.includes(m)), key: keyName(key) };
}

/** The steps of a shortcut. A sequence has more than one ("G then S"). Throws on a malformed text. */
export function parseKeys(keys: string): Chord[] {
  const steps = keys.trim().split(/\s+then\s+/i);
  return steps.map((step) => parseChord(step.replaceAll(" ", ""), keys));
}

/** One text per shortcut that means the same keys, to find two registrations of the same shortcut. */
export const canonicalKeys = (keys: string): string =>
  parseKeys(keys)
    .map((c) => [...c.modifiers, c.key].join("+"))
    .join(" ");

/** By default a shortcut stays out of text fields unless it holds Mod, Ctrl or Meta. */
export const firesInFields = (steps: readonly Chord[]): boolean =>
  steps[0]?.modifiers.some((m) => m === "Mod" || m === "Ctrl" || m === "Meta") ?? false;

const APPLE_MODIFIERS: Record<Modifier, string> = { Ctrl: "⌃", Alt: "⌥", Shift: "⇧", Mod: "⌘", Meta: "⌘" };
const OTHER_MODIFIERS: Record<Modifier, string> = {
  Ctrl: "Ctrl",
  Alt: "Alt",
  Shift: "Shift",
  Mod: "Ctrl",
  Meta: "Meta",
};
const KEY_LABELS: Record<string, string> = {
  Escape: "Esc",
  Enter: "↵",
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
};
/** Apple devices put the modifiers in this order. */
const APPLE_ORDER: readonly Modifier[] = ["Ctrl", "Alt", "Shift", "Mod", "Meta"];

/** The parts to show for each step: ["⌘", "K"] on Apple devices, ["Ctrl", "K"] elsewhere. */
export function formatSteps(keys: string, apple: boolean): string[][] {
  return parseKeys(keys).map((chord) => {
    const order = apple ? APPLE_ORDER : MODIFIERS;
    const names = apple ? APPLE_MODIFIERS : OTHER_MODIFIERS;
    const parts = order.filter((m) => chord.modifiers.includes(m)).map((m) => names[m]);
    return [...new Set(parts), KEY_LABELS[chord.key] ?? chord.key];
  });
}

/** The names the keyboard library reads: "Control" for Ctrl, the rest as written. */
export const libraryChord = (chord: Chord): string =>
  [...chord.modifiers.map((m) => (m === "Ctrl" ? "Control" : m)), chord.key].join("+");
