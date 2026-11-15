import { resolve } from "node:path";

export const ROOT = resolve(import.meta.dir, "../..");
export const at = (...parts: string[]): string => resolve(ROOT, ...parts);
