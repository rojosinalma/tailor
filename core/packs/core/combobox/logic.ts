/** Logic that both kits of the combobox and the multi-select share. */

export interface Choice {
  readonly value: string;
  readonly label: string;
}

/** Whether a choice matches the typed text: its label contains the text, ignoring case. */
export function matches(label: string, query: string, locale?: string): boolean {
  const q = query.trim().toLocaleLowerCase(locale);
  return q === "" || label.toLocaleLowerCase(locale).includes(q);
}

/** The value that Enter keeps with allowCustom: typed text that names no choice. */
export function customText(text: string, choices: readonly Choice[]): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLocaleLowerCase();
  return choices.some((c) => c.label.toLocaleLowerCase() === lower || c.value === trimmed) ? null : trimmed;
}
