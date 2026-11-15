/** The built-in texts. A project replaces any of them with setTexts() to translate the UI. */
import { TEXTS } from "./texts.gen";

export type TextKey = keyof typeof TEXTS;

const texts: Record<TextKey, string> = { ...TEXTS };

export function setTexts(change: Partial<Record<TextKey, string>>): void {
  Object.assign(texts, change);
}

export function t(key: TextKey): string {
  return texts[key];
}
