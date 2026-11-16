/** The built-in texts. A project replaces any of them with setTexts() to translate the UI. */
import { TEXTS } from "./texts.gen";

export type TextKey = keyof typeof TEXTS;

// One table per page, shared by every script file. In the HTML kit each pack's script adds its own texts.
const host = globalThis as { __tailorTexts?: Record<string, string> };
if (!host.__tailorTexts) host.__tailorTexts = {};
const texts = host.__tailorTexts as Record<TextKey, string>;
for (const [key, value] of Object.entries(TEXTS)) texts[key as TextKey] ??= value;

export function setTexts(change: Partial<Record<TextKey, string>>): void {
  Object.assign(texts, change);
}

export function t(key: TextKey): string {
  return texts[key];
}
