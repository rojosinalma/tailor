/**
 * The file logic of the file picker, shared by both kits. Plain TypeScript, no DOM:
 * a file is anything with a name, a size and a type, so a File fits.
 */

export interface FileLike {
  readonly name: string;
  readonly size: number;
  readonly type: string;
}

export interface FileRules {
  /** The accept attribute: extensions (".pdf"), MIME types ("image/png") or groups ("image/*"). */
  readonly accept?: string | null;
  readonly multiple?: boolean;
  /** The largest size in bytes. */
  readonly maxSize?: number | null;
  /** The most files at once. */
  readonly maxFiles?: number | null;
}

export type Refusal =
  | { readonly reason: "type"; readonly name: string }
  | { readonly reason: "size"; readonly name: string; readonly limit: number }
  | { readonly reason: "count"; readonly name: string; readonly limit: number };

const UNITS = ["B", "kB", "MB", "GB", "TB"];

/** A size as people read it: "980 B", "1.5 MB", "12 MB". Steps of 1000, as file managers show it. */
export function formatSize(bytes: number, locale?: string): string {
  let value = Math.max(0, bytes);
  let unit = 0;
  while (value >= 1000 && unit < UNITS.length - 1) {
    value /= 1000;
    unit++;
  }
  const digits = unit === 0 || value >= 10 ? 0 : 1;
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(value)} ${UNITS[unit]}`;
}

/** Whether a file matches an accept attribute; an empty accept takes every file. */
export function matchesAccept(file: FileLike, accept?: string | null): boolean {
  const rules = (accept ?? "")
    .split(",")
    .map((rule) => rule.trim().toLowerCase())
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

/**
 * The files after a choice or a drop: the new files join the kept ones (or replace them for a single file),
 * a file of the wrong type, too large or over the count is refused with the reason.
 */
export function addFiles<F extends FileLike>(
  kept: readonly F[],
  added: readonly F[],
  rules: FileRules,
): { files: F[]; refused: Refusal[] } {
  const files: F[] = rules.multiple ? [...kept] : [];
  const refused: Refusal[] = [];
  const most = rules.multiple ? (rules.maxFiles ?? Number.POSITIVE_INFINITY) : 1;
  for (const file of rules.multiple ? added : added.slice(0, 1)) {
    if (!matchesAccept(file, rules.accept)) refused.push({ reason: "type", name: file.name });
    else if (rules.maxSize && file.size > rules.maxSize)
      refused.push({ reason: "size", name: file.name, limit: rules.maxSize });
    else if (files.length >= most) refused.push({ reason: "count", name: file.name, limit: most });
    else files.push(file);
  }
  if (!rules.multiple && files.length === 0 && kept[0]) files.push(kept[0]);
  return { files, refused };
}

/** The error line of a refused file. The texts come from the kit: they can be translated. */
export function refusalText(
  refusal: Refusal,
  texts: { type: string; size: string; count: string },
  locale?: string,
): string {
  if (refusal.reason === "type") return `${refusal.name}: ${texts.type}`;
  if (refusal.reason === "size") return `${refusal.name}: ${texts.size} ${formatSize(refusal.limit, locale)}`;
  return `${refusal.name}: ${texts.count} ${refusal.limit}`;
}
