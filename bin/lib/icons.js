// tailor — icon sets. The adopted sets are listed in icons/sets.json and pinned as @iconify-json/<id> packages in
// icons/package.json (`bun install` there). This module reads the installed Iconify JSON (icons.json + info.json)
// and renders subsetted SVG sprites: one <symbol id="<prefix>-<name>" viewBox="…"> per requested icon, bodies as
// shipped (they use currentColor). Nothing from the packages is copied into the repo; the sprite is the artefact.
// Bun, no dependencies.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, readJson, validate } from "./common.js";

export const ICONS_DIR = join(ROOT, "icons");
const SETS_FILE = join(ICONS_DIR, "sets.json");
const MODULES = join(ICONS_DIR, "node_modules", "@iconify-json");

export const SETS_SCHEMA = {
  type: "object",
  required: ["sets"],
  properties: {
    $comment: { type: "string" },
    sets: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        required: ["id", "name", "license", "upstream"],
        additionalProperties: false,
        properties: {
          id: { type: "string", pattern: "^[a-z][a-z0-9-]*$" },
          name: { type: "string", minLength: 1 },
          license: { type: "string", minLength: 1 },
          upstream: { type: "string", pattern: "^https://" },
        },
      },
    },
  },
};

// ---------- adopted sets ----------
export function listIconSets() {
  if (!existsSync(SETS_FILE)) return [];
  const doc = readJson(SETS_FILE);
  const errs = validate(doc, SETS_SCHEMA);
  if (errs.length) throw new Error(`icons/sets.json is invalid:\n  ${errs.join("\n  ")}`);
  const ids = doc.sets.map((s) => s.id), dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dup.length) throw new Error(`icons/sets.json: duplicate set ids ${dup.join(", ")}`);
  return doc.sets;
}
export const pinnedVersion = (id) => {
  const f = join(ICONS_DIR, "package.json");
  return existsSync(f) ? readJson(f).dependencies?.[`@iconify-json/${id}`] ?? null : null;
};
export const iconSetInstalled = (id) => existsSync(join(MODULES, id, "icons.json"));
export const iconsInstalled = () => listIconSets().every((s) => iconSetInstalled(s.id));
export const iconsMissingMessage = () =>
  `icon data not installed (looked for ${listIconSets().filter((s) => !iconSetInstalled(s.id)).map((s) => `@iconify-json/${s.id}`).join(", ") || "icons/node_modules"}) — run \`bun install\` in icons/`;

const cache = new Map();
// → { id, prefix, name, version, package_version, license, license_url, upstream, count, data, info }
export function loadIconSet(id) {
  if (cache.has(id)) return cache.get(id);
  const entry = listIconSets().find((s) => s.id === id);
  if (!entry) throw new Error(`icon set "${id}" is not adopted — adopted sets: ${listIconSets().map((s) => s.id).join(" ")} (icons/sets.json)`);
  const dir = join(MODULES, id);
  if (!existsSync(join(dir, "icons.json"))) throw new Error(`icon set "${id}": ${iconsMissingMessage()}`);
  const data = readJson(join(dir, "icons.json")), info = readJson(join(dir, "info.json")), pkg = readJson(join(dir, "package.json"));
  const set = {
    ...entry,
    prefix: data.prefix,
    name: info.name ?? entry.name,
    version: info.version ?? pkg.iconSetVersion ?? pkg.version,
    package_version: pkg.version,
    license: info.license?.spdx ?? entry.license,
    license_url: info.license?.url ?? null,
    count: Object.values(data.icons).filter((i) => !i.hidden).length,
    data, info,
  };
  cache.set(id, set);
  return set;
}

// ---------- icons ----------
// Resolve "<prefix>:<name>" (alias-aware) → { id, name, viewBox, body }
export function resolveIcon(ref) {
  const m = /^([a-z][a-z0-9-]*):([a-z0-9][a-z0-9-]*)$/.exec(ref);
  if (!m) throw new Error(`"${ref}" is not an icon reference — expected <set>:<name>, e.g. bi:house`);
  const [, id, name] = m;
  const set = loadIconSet(id), d = set.data;
  let icon = d.icons[name], alias = null;
  if (!icon && d.aliases?.[name]) { alias = d.aliases[name]; icon = d.icons[alias.parent]; }
  if (!icon) throw new Error(`icon "${ref}" not found in ${set.name} — try \`tailor icons search ${name}\``);
  const src = { ...icon, ...(alias ?? {}) };
  const w = src.width ?? d.width ?? 16, h = src.height ?? d.height ?? 16, left = src.left ?? d.left ?? 0, top = src.top ?? d.top ?? 0;
  let body = icon.body;
  // alias transforms (rare): rotate = quarter turns, hFlip/vFlip
  const t = [];
  if (alias?.rotate) t.push(`rotate(${(alias.rotate % 4) * 90} ${left + w / 2} ${top + h / 2})`);
  if (alias?.hFlip) t.push(`translate(${2 * left + w} 0) scale(-1 1)`);
  if (alias?.vFlip) t.push(`translate(0 ${2 * top + h}) scale(1 -1)`);
  if (t.length) body = `<g transform="${t.join(" ")}">${body}</g>`;
  return { id, name, symbol: `${id}-${name}`, viewBox: `${left} ${top} ${w} ${h}`, body };
}

// Sprite: one <symbol> per icon, sorted by symbol id; header names every set and its licence.
// `header` is the first line (the managed-by-tailor comment for vendored sprites; the build passes its own).
export function renderSprite(refs, { header = "" } = {}) {
  const icons = [...new Set(refs)].map(resolveIcon).sort((a, b) => a.symbol.localeCompare(b.symbol));
  const sets = [...new Set(icons.map((i) => i.id))].map(loadIconSet);
  const licences = sets.map((s) => `     ${s.name} ${s.version} (${s.prefix}:*) — ${s.license}${s.license_url ? `, ${s.license_url}` : ""} — ${s.upstream}`).join("\n");
  return `${header}<!-- tailor icon sprite: ${icons.length} icon${icons.length === 1 ? "" : "s"} from ${sets.length} set${sets.length === 1 ? "" : "s"}. Use: <svg class="t-icon" aria-hidden="true"><use href="…/icons.svg#<set>-<name>"/></svg>
     Icon data via Iconify (https://iconify.design), under each set's licence:
${licences} -->
<svg xmlns="http://www.w3.org/2000/svg">
${icons.map((i) => `  <symbol id="${i.symbol}" viewBox="${i.viewBox}">${i.body}</symbol>`).join("\n")}
</svg>
`;
}

// Name search across the adopted sets (substring on names and aliases) → [{ ref, set }]
export function searchIcons(term, { limit = 50 } = {}) {
  const q = term.toLowerCase();
  const hits = [];
  for (const { id } of listIconSets()) {
    const set = loadIconSet(id);
    const names = [...Object.entries(set.data.icons).filter(([, i]) => !i.hidden).map(([n]) => n), ...Object.keys(set.data.aliases ?? {})];
    for (const n of names.sort()) if (n.includes(q)) hits.push({ ref: `${id}:${n}`, set: set.name });
  }
  // exact and prefix matches first
  hits.sort((a, b) => rank(a.ref, q) - rank(b.ref, q) || a.ref.localeCompare(b.ref));
  return { total: hits.length, hits: hits.slice(0, limit) };
}
const rank = (ref, q) => { const n = ref.split(":")[1]; return n === q ? 0 : n.startsWith(q) ? 1 : 2; };

// manifest.json → icon_sets[]
export const manifestIconSets = () =>
  listIconSets().map((s) => {
    const { id, prefix, name, version, package_version, license, license_url, upstream, count } = loadIconSet(s.id);
    return { id, prefix, name, version, package_version, license, license_url, upstream, count, package: `@iconify-json/${id}` };
  });

// Showcase sample: the set's own samples (info.json) padded with common names it has, 8 per set.
const COMMON = ["house", "home", "settings", "gear", "search", "check", "bell", "star", "github", "x", "plus", "trash"];
export function sampleIcons(id, n = 8) {
  const set = loadIconSet(id);
  const has = (k) => set.data.icons[k] && !set.data.icons[k].hidden;
  const names = (set.info.samples ?? []).filter(has);
  for (const k of COMMON) { if (names.length >= n) break; if (has(k) && !names.includes(k)) names.push(k); }
  return names.slice(0, n).map((name) => `${id}:${name}`);
}
