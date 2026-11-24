/** The commands. Each returns its result as data and as text lines; main.ts prints one of the two. */
import { mkdir, stat } from "node:fs/promises";
import { resolve } from "node:path";
import type { IconData } from "../../core/src/sprite";
import { ICON_SETS } from "../../core/src/sprite";
import { Problem, UsageError } from "./errors";
import { headHtml, themeConfig } from "./head";
import { scanIcons, spriteOf } from "./icons";
import { isSafePath, type Kit, type Manifest, shellNames, shellPack, withRequirements } from "./manifest";
import {
  applyPlan,
  diskHashes,
  Project,
  planFiles,
  recordAfter,
  type Step,
  type Summary,
  sha256,
  summarize,
  type Wanted,
} from "./plan";
import { reactPackage } from "./react-package";
import { type Reference, renderIndex } from "./reference-md";
import { type Folders, librariesOf, pageAssets, publicRoot, selectFiles, vendorRoot } from "./select";
import {
  DEFAULT_BASE,
  DEFAULT_SCAN,
  DEFAULT_SOURCE,
  defaultKey,
  formatState,
  isBase,
  readState,
  STATE_FILE,
  type State,
  type ThemeMode,
} from "./state";
import { type Endpoints, findRelease, type Release } from "./store";
import { compareVersions, isBetween, isPrerelease } from "./version";

export interface Context {
  readonly cwd: string;
  readonly store: string;
  readonly endpoints?: Endpoints;
}

export interface Output {
  readonly data: Readonly<Record<string, unknown>>;
  readonly lines: readonly string[];
}

/** Options every command that reads a release takes. */
export interface ReleaseInput {
  readonly from?: string;
  readonly offline?: boolean;
  /** A pre-release may be picked when no version is named. */
  readonly pre?: boolean;
  readonly verbose?: boolean;
}

const folderOf = (ctx: Context, dir: string | undefined): string => resolve(ctx.cwd, dir ?? ".");

async function requireFolder(dir: string): Promise<void> {
  try {
    if ((await stat(dir)).isDirectory()) return;
  } catch {
    // Reported below.
  }
  throw new Problem(`${dir} is not a folder.`, "Name the project folder, or run the command inside it.");
}

async function requireState(dir: string): Promise<State> {
  await requireFolder(dir);
  const state = await readState(dir);
  if (!state)
    throw new Problem(
      `${dir} has no ${STATE_FILE}: tailor is not in this project yet.`,
      "Run: tailor add --kit react|html",
    );
  return state;
}

const tailorRoots = (state: Pick<State, "kit"> & Folders): string[] =>
  state.kit === "react" ? [publicRoot(state), vendorRoot(state)] : [publicRoot(state)];

/** The folder above which a removal keeps empty folders. */
const stopAt =
  (roots: readonly string[]) =>
  (path: string): string =>
    roots.find((r) => path.startsWith(`${r}/`)) ?? ".";

async function iconSets(release: Release): Promise<Record<string, IconData>> {
  const sets: Record<string, IconData> = {};
  for (const set of ICON_SETS) {
    const path = `icons/${set}.json`;
    if (release.manifest.files.some((f) => f.path === path))
      sets[set] = JSON.parse(await release.text(path)) as IconData;
  }
  return sets;
}

async function sprite(root: string, state: State, release: Release): Promise<string> {
  const skip = [publicRoot(state), vendorRoot(state)];
  const names = await scanIcons(root, state.icons.scan, skip);
  // The HTML kit's markup draws the glyphs of its parts from the sprite (icons.svg#t-close).
  const glyphs =
    state.kit === "html"
      ? Object.assign({}, ...state.packs.map((pack) => release.manifest.glyphs?.[pack] ?? {}))
      : {};
  return spriteOf([...names, ...state.icons.add], await iconSets(release), glyphs);
}

const made = (data: string): Wanted => ({ sha256: sha256(data), data: async () => data });

/** Every file the project should hold for this state: the release's files and the ones made from them. */
async function wantedFiles(root: string, state: State, release: Release): Promise<Map<string, Wanted>> {
  const { manifest } = release;
  const wanted = new Map<string, Wanted>();
  for (const p of selectFiles(manifest, state.kit, state.packs, state))
    wanted.set(p.to, { sha256: p.sha256, data: () => release.bytes(p.from) });
  const pub = publicRoot(state);
  const head = headHtml(
    await release.text("html/head.html"),
    themeConfig(manifest, state.theme),
    pageAssets(manifest, state.kit, state.packs),
  );
  wanted.set(`${pub}/head.html`, made(head));
  wanted.set(`${pub}/icons.svg`, made(await sprite(root, state, release)));
  const reference = JSON.parse(await release.text("reference.json")) as Reference;
  const docs = state.kit === "react" ? vendorRoot(state) : pub;
  wanted.set(`${docs}/REFERENCE.md`, made(renderIndex(reference, state.packs)));
  if (state.kit === "react") {
    const pkg = reactPackage(
      manifest.version,
      manifest.packs,
      manifest.files.map((f) => f.path),
      state.packs,
    );
    wanted.set(`${vendorRoot(state)}/package.json`, made(`${JSON.stringify(pkg, null, 2)}\n`));
  }
  return wanted;
}

interface Planned {
  readonly steps: Step[];
  readonly wanted: Map<string, Wanted>;
  readonly summary: Summary;
}

async function planFor(
  project: Project,
  before: State | undefined,
  after: State,
  release: Release,
): Promise<Planned> {
  const wanted = await wantedFiles(project.root, after, release);
  const recorded = before?.files ?? {};
  const disk = await diskHashes(project, [...wanted.keys(), ...Object.keys(recorded)]);
  const steps = planFiles(new Map([...wanted].map(([p, w]) => [p, w.sha256])), recorded, disk);
  return { steps, wanted, summary: summarize(steps) };
}

async function apply(project: Project, planned: Planned, after: State): Promise<State> {
  await applyPlan(project, planned.steps, planned.wanted, stopAt(tailorRoots(after)));
  const state: State = { ...after, files: recordAfter(planned.steps) };
  await project.write(STATE_FILE, formatState(state));
  return state;
}

/** Refuses to go on when git shows uncommitted changes in the tailor folders. Skipped outside git. */
async function checkClean(root: string, state: State, force: boolean | undefined): Promise<void> {
  if (force) return;
  const run = async (args: string[]): Promise<{ code: number; out: string }> => {
    try {
      const proc = Bun.spawn(["git", "-C", root, ...args], { stdout: "pipe", stderr: "ignore" });
      const [out, code] = await Promise.all([new Response(proc.stdout).text(), proc.exited]);
      return { code, out };
    } catch {
      return { code: -1, out: "" };
    }
  };
  if ((await run(["rev-parse", "--is-inside-work-tree"])).code !== 0) return;
  const paths = [...new Set([...tailorRoots(state), STATE_FILE])];
  const status = await run(["status", "--porcelain", "--", ...paths]);
  const lines = status.out.split("\n").filter(Boolean);
  if (lines.length > 0)
    throw new Problem(
      `The tailor folders have uncommitted changes:\n${lines.map((l) => `  ${l}`).join("\n")}`,
      "Commit or undo them first, so the change is easy to review, or run again with --force.",
    );
}

const count = (n: number, one: string, many = `${one}s`): string => `${n} ${n === 1 ? one : many}`;

/** Files written, counted per folder below the tailor folders. */
function writtenPerGroup(steps: readonly Step[], roots: readonly string[]): Record<string, number> {
  const groups: Record<string, number> = {};
  for (const step of steps) {
    if (step.kind !== "add" && step.kind !== "change") continue;
    const root = roots.find((r) => step.path.startsWith(`${r}/`));
    const rest = root ? step.path.slice(root.length + 1) : step.path;
    const group = root ? (rest.includes("/") ? `${root}/${rest.split("/")[0]}` : root) : ".";
    groups[group] = (groups[group] ?? 0) + 1;
  }
  return groups;
}

function summaryLines(summary: Summary, verbose: boolean | undefined, applied: boolean): string[] {
  const lines: string[] = [];
  const verb = applied
    ? { add: "added", change: "changed", remove: "removed" }
    : { add: "to add", change: "to change", remove: "to remove" };
  const list = (label: string, paths: readonly string[]) => {
    lines.push(`${label}: ${paths.length}`);
    if (verbose) for (const p of paths) lines.push(`  ${p}`);
  };
  list(`files ${verb.add}`, summary.added);
  list(`files ${verb.change}`, summary.changed);
  list(`files ${verb.remove}`, summary.removed);
  lines.push(`files unchanged: ${summary.unchanged}`);
  if (summary.kept.length) {
    lines.push(`files the project edited, kept as they are: ${summary.kept.length}`);
    for (const p of summary.kept) lines.push(`  ${p}`);
  }
  if (summary.newFiles.length) {
    lines.push(`new versions ${applied ? "written" : "to write"} next to them: ${summary.newFiles.length}`);
    for (const p of summary.newFiles) lines.push(`  ${p}`);
  }
  return lines;
}

function releaseOf(
  ctx: Context,
  input: ReleaseInput,
  source: string,
  version: string | undefined,
  notes: string[],
  /** The project's version: a project on a pre-release may move to another one. */
  current?: string,
) {
  return findRelease({
    ...(input.from ? { from: input.from } : {}),
    ...(version ? { version } : {}),
    pre: input.pre === true || (current !== undefined && isPrerelease(current)),
    source,
    offline: input.offline ?? false,
    store: ctx.store,
    ...(ctx.endpoints ? { endpoints: ctx.endpoints } : {}),
    notes,
  });
}

function htmlNotes(manifest: Manifest, kit: Kit, packs: readonly string[]): string[] {
  if (kit !== "html") return [];
  const missing = packs.filter((id) => manifest.packs.find((p) => p.id === id)?.html === "none");
  if (missing.length)
    throw new Problem(
      `The HTML kit has no ${missing.join(", ")}: ${missing.length === 1 ? "that pack is" : "those packs are"} React only.`,
      "Leave them out, or use the React kit.",
    );
  return packs.flatMap((id) => {
    const html = manifest.packs.find((p) => p.id === id)?.html;
    return typeof html === "object" ? [`the HTML kit has part of the pack ${id}: ${html.partial}`] : [];
  });
}

function emptyPackNotes(manifest: Manifest, packs: readonly string[]): string[] {
  return packs
    .filter((id) => !manifest.files.some((f) => f.pack === id))
    .map((id) => `the pack ${id} has no files in this release yet: nothing to install for it`);
}

function reactHints(
  state: State,
  manifest: Manifest,
): { bunAdd: string; bunAddTypes?: string; lines: string[] } {
  const pinned = (libs: Record<string, string>) => Object.entries(libs).map(([n, v]) => `${n}@${v}`);
  const bunAdd = `bun add ${pinned(librariesOf(manifest, state.packs)).join(" ")}`;
  const types = pinned(librariesOf(manifest, state.packs, true));
  const bunAddTypes = types.length ? `bun add -d ${types.join(" ")}` : undefined;
  const ven = vendorRoot(state);
  return {
    bunAdd,
    ...(bunAddTypes ? { bunAddTypes } : {}),
    lines: [
      "install the libraries of the installed packs (the second line: their types, for TypeScript):",
      `  ${bunAdd}`,
      ...(bunAddTypes ? [`  ${bunAddTypes}`] : []),
      "import the components by pack:",
      '  import { Button } from "tailor/core";',
      `make "tailor" point at ${ven}, one of:`,
      `  package.json: "dependencies": { "tailor": "file:./${ven}" } (or a workspace entry "${ven}"), then bun install`,
      `  tsconfig.json: "paths": { "tailor/*": ["./${ven}/*"] }, and the same alias in the bundler`,
    ],
  };
}

export interface AddInput extends ReleaseInput {
  readonly dir?: string;
  readonly kit?: Kit;
  readonly shell?: string;
  readonly packs?: readonly string[];
  readonly version?: string;
  readonly key?: string;
  readonly skin?: string;
  readonly palette?: string;
  readonly mode?: ThemeMode;
  readonly public?: string;
  readonly vendor?: string;
  readonly base?: string;
  readonly replaceShell?: boolean;
}

export async function add(ctx: Context, input: AddInput): Promise<Output> {
  const root = folderOf(ctx, input.dir);
  await mkdir(root, { recursive: true });
  const before = await readState(root);
  const kit = input.kit ?? before?.kit;
  if (!kit) throw new UsageError("The first use in a folder needs --kit react or --kit html.");
  if (before && kit !== before.kit)
    throw new Problem(
      `This project uses the ${before.kit} kit; a project has one kit.`,
      `To change it, remove ${STATE_FILE} and the tailor folders, then run tailor add again.`,
    );
  if (before && input.version && input.version !== before.tailor)
    throw new Problem(
      `This project has tailor ${before.tailor}.`,
      `To change the version, run: tailor upgrade --to ${input.version}`,
    );
  for (const [name, value] of [
    ["public", input.public],
    ["vendor", input.vendor],
  ] as const)
    if (value !== undefined && !isSafePath(value.replace(/\/$/, "")))
      throw new UsageError(`--${name} must be a folder inside the project, such as ${name}.`);
  if (input.base !== undefined && !isBase(input.base))
    throw new UsageError("--base must be an address that ends with a slash, such as /tailor/css/.");

  const notes: string[] = [];
  const source = before?.source ?? DEFAULT_SOURCE;
  const release = await releaseOf(ctx, input, source, input.version ?? before?.tailor, notes);
  const { manifest } = release;

  const shells = shellNames(manifest);
  if (input.shell && !shells.includes(input.shell))
    throw new Problem(
      `This release has no shell "${input.shell}".`,
      `Pick one of: ${shells.join(", ") || "(none yet)"}.`,
    );
  if (before?.shell && input.shell && input.shell !== before.shell && !input.replaceShell)
    throw new Problem(
      `This project has the shell ${before.shell}.`,
      `To use ${input.shell} instead, run again with --replace-shell.`,
    );
  for (const id of input.packs ?? [])
    if (manifest.packs.find((p) => p.id === id)?.shell)
      throw new UsageError(`${id} is a shell: use --shell ${id.replace(/^shell-/, "")}.`);
  const shell = input.shell ?? before?.shell;
  const kept = (before?.packs ?? []).filter(
    (p) => !(input.shell && before?.shell && p === shellPack(before.shell)),
  );
  const packs = withRequirements(manifest.packs, [
    "core",
    ...kept,
    ...(input.packs ?? []),
    ...(shell ? [shellPack(shell)] : []),
  ]);
  notes.push(...htmlNotes(manifest, kit, packs), ...emptyPackNotes(manifest, packs));

  const pick = (kind: "skin" | "palette", value: string | undefined, fallback: string): string => {
    const list = kind === "skin" ? manifest.skins : manifest.palettes;
    const id = value ?? fallback;
    if (!list.some((x) => x.id === id))
      throw new Problem(
        `This release has no ${kind} "${id}".`,
        `Pick one of: ${list.map((x) => x.id).join(", ")}.`,
      );
    return id;
  };
  const after: State = {
    tailor: manifest.version,
    source,
    kit,
    ...(shell ? { shell } : {}),
    packs,
    public: input.public?.replace(/\/$/, "") ?? before?.public ?? "public",
    vendor: input.vendor?.replace(/\/$/, "") ?? before?.vendor ?? "vendor",
    theme: {
      key: input.key ?? before?.theme.key ?? defaultKey(root),
      skin: pick("skin", input.skin, before?.theme.skin ?? manifest.theme.skin),
      palette: pick("palette", input.palette, before?.theme.palette ?? manifest.theme.palette),
      mode: input.mode ?? before?.theme.mode ?? "auto",
      base: input.base ?? before?.theme.base ?? DEFAULT_BASE,
    },
    icons: before?.icons ?? { scan: DEFAULT_SCAN, add: [] },
    files: before?.files ?? {},
  };

  const project = new Project(root);
  const planned = await planFor(project, before, after, release);
  const state = await apply(project, planned, after);
  const head = await Bun.file(resolve(root, publicRoot(state), "head.html")).text();
  const written = writtenPerGroup(planned.steps, tailorRoots(state));
  const react = kit === "react" ? reactHints(state, manifest) : undefined;
  const lines = [
    ...notes,
    `tailor ${state.tailor}, ${kit} kit${shell ? `, shell ${shell}` : ""}, packs ${state.packs.join(", ")}`,
    ...Object.entries(written).map(([group, n]) => `written: ${group}: ${count(n, "file")}`),
    ...(Object.keys(written).length ? [] : ["written: nothing; the files were already in place"]),
    ...planned.summary.kept.map((p) => `kept (edited by the project): ${p}`),
    ...planned.summary.newFiles.map((p) => `new version next to it: ${p}`),
    `state: ${STATE_FILE}`,
    "put these lines in the <head> of every page:",
    ...head
      .trimEnd()
      .split("\n")
      .map((l) => `  ${l}`),
    ...(react?.lines ?? []),
  ];
  return {
    data: {
      version: state.tailor,
      kit,
      shell: shell ?? null,
      packs: state.packs,
      written,
      kept: planned.summary.kept,
      newFiles: planned.summary.newFiles,
      head,
      ...(react
        ? {
            bunAdd: react.bunAdd,
            ...(react.bunAddTypes ? { bunAddTypes: react.bunAddTypes } : {}),
            import: 'import { Button } from "tailor/core";',
          }
        : {}),
      notes,
    },
    lines,
  };
}

export interface UpgradeInput extends ReleaseInput {
  readonly dir?: string;
  readonly to?: string;
  readonly yes?: boolean;
  readonly force?: boolean;
}

export async function upgrade(ctx: Context, input: UpgradeInput): Promise<Output> {
  const root = folderOf(ctx, input.dir);
  const before = await requireState(root);
  const notes: string[] = [];
  const release = await releaseOf(ctx, input, before.source, input.to, notes, before.tailor);
  const { manifest } = release;
  const gone = before.packs.filter((id) => !manifest.packs.some((p) => p.id === id));
  if (gone.length)
    throw new Problem(
      `Version ${manifest.version} has no pack ${gone.join(", ")}.`,
      `Read its breaking changes, then remove the pack first: tailor remove ${gone[0]}`,
    );
  const packs = withRequirements(manifest.packs, before.packs);
  const after: State = { ...before, tailor: manifest.version, packs };
  notes.push(...htmlNotes(manifest, before.kit, packs));
  const project = new Project(root);
  const planned = await planFor(project, before, after, release);

  const from = before.tailor;
  const to = manifest.version;
  const direction = compareVersions(to, from);
  const lo = direction >= 0 ? from : to;
  const hi = direction >= 0 ? to : from;
  const breaking = manifest.breaking.filter((b) => isBetween(b.version, lo, hi));
  const changelog = (manifest.changelog ?? []).filter((c) => isBetween(c.version, lo, hi));
  const added = packs.filter((p) => !before.packs.includes(p));

  const lines = [
    ...notes,
    `current version: ${from}`,
    `target version: ${to}${direction < 0 ? " (older: a downgrade)" : direction === 0 ? " (the same)" : ""}`,
    ...(added.length ? [`packs the new version adds as requirements: ${added.join(", ")}`] : []),
  ];
  for (const entry of changelog) {
    lines.push(`changes in ${entry.version}:`);
    for (const l of entry.lines) lines.push(`  - ${l}`);
  }
  for (const b of breaking) {
    lines.push(`breaking change in ${b.version}: ${b.title}`);
    b.steps.forEach((s, i) => {
      lines.push(`  ${i + 1}. ${s}`);
    });
    if (b.codemod) lines.push(`  codemod: ${b.codemod}`);
  }
  let applied = false;
  if (input.yes) {
    await checkClean(root, before, input.force);
    await apply(project, planned, after);
    applied = true;
  }
  lines.push(...summaryLines(planned.summary, input.verbose, applied));
  lines.push(applied ? `upgraded to ${to}` : "nothing written: run again with --yes to apply");
  return {
    data: { from, to, applied, ...planned.summary, breaking, changelog, packs, notes },
    lines,
  };
}

export interface RemoveInput extends ReleaseInput {
  readonly pack: string;
  readonly dir?: string;
  readonly yes?: boolean;
  readonly force?: boolean;
}

/** Pure: the packs that go when one is removed, and the ones that stay. */
export function removalPlan(
  manifest: Manifest,
  installed: readonly string[],
  pack: string,
): { removed: string[]; remaining: string[] } {
  if (pack === "core") throw new Problem("The pack core cannot be removed: every other pack needs it.");
  if (!installed.includes(pack))
    throw new Problem(`The pack ${pack} is not installed.`, `Installed: ${installed.join(", ")}.`);
  const dependents = installed.filter(
    (id) => id !== pack && withRequirements(manifest.packs, [id]).includes(pack),
  );
  if (dependents.length)
    throw new Problem(
      `${dependents.join(", ")} ${dependents.length === 1 ? "needs" : "need"} the pack ${pack}.`,
      `Remove ${dependents.join(", ")} first.`,
    );
  const candidates = withRequirements(manifest.packs, [pack]).filter((id) => id !== pack && id !== "core");
  const others = installed.filter((id) => id !== pack && !candidates.includes(id));
  const needed = withRequirements(manifest.packs, ["core", ...others]);
  const removed = [pack, ...candidates.filter((id) => installed.includes(id) && !needed.includes(id))];
  return { removed, remaining: installed.filter((id) => !removed.includes(id)) };
}

export async function remove(ctx: Context, input: RemoveInput): Promise<Output> {
  const root = folderOf(ctx, input.dir);
  const before = await requireState(root);
  const notes: string[] = [];
  const release = await releaseOf(ctx, input, before.source, before.tailor, notes);
  const { manifest } = release;
  const { removed, remaining } = removalPlan(manifest, before.packs, input.pack);
  const shellGone = before.shell && removed.includes(shellPack(before.shell));
  const { shell: _old, ...rest } = before;
  const after: State = { ...(shellGone ? rest : before), packs: remaining };
  const project = new Project(root);
  const planned = await planFor(project, before, after, release);
  const droppable = (types: boolean): string[] => {
    if (before.kit !== "react") return [];
    const kept = librariesOf(manifest, remaining, types);
    return Object.keys(librariesOf(manifest, before.packs, types)).filter((n) => !(n in kept));
  };
  const drop = droppable(false);
  const dropTypes = droppable(true);
  let applied = false;
  if (input.yes) {
    await checkClean(root, before, input.force);
    await apply(project, planned, after);
    applied = true;
  }
  const lines = [
    ...notes,
    `packs ${applied ? "removed" : "to remove"}: ${removed.join(", ")}`,
    ...(removed.length > 1
      ? [
          `  (${removed.slice(1).join(", ")}: only ${input.pack} needed ${removed.length > 2 ? "them" : "it"})`,
        ]
      : []),
    `packs that stay: ${remaining.join(", ")}`,
    ...summaryLines(planned.summary, input.verbose, applied),
    ...(drop.length
      ? [`libraries the project can drop: ${drop.join(" ")}`, `  bun remove ${drop.join(" ")}`]
      : []),
    ...(dropTypes.length
      ? [`type packages the project can drop: ${dropTypes.join(" ")}`, `  bun remove ${dropTypes.join(" ")}`]
      : []),
    applied ? "done" : "nothing written: run again with --yes to remove",
  ];
  return {
    data: {
      ...planned.summary,
      packs: { removed, remaining },
      applied,
      libraries: drop,
      types: dropTypes,
      notes,
    },
    lines,
  };
}

export interface ListInput extends ReleaseInput {
  readonly dir?: string;
  readonly version?: string;
  readonly components?: boolean;
}

export async function list(ctx: Context, input: ListInput): Promise<Output> {
  const root = folderOf(ctx, input.dir);
  const state = await readState(root);
  const notes: string[] = [];
  const release = await releaseOf(
    ctx,
    input,
    state?.source ?? DEFAULT_SOURCE,
    input.version ?? state?.tailor,
    notes,
  );
  const { manifest } = release;
  const lines = [...notes];
  if (state) {
    lines.push(
      `installed: tailor ${state.tailor}`,
      `kit: ${state.kit}`,
      `shell: ${state.shell ?? "none"}`,
      `packs: ${state.packs.join(", ")}`,
      `theme: skin ${state.theme.skin}, palette ${state.theme.palette}, mode ${state.theme.mode}, key ${state.theme.key}`,
      "",
    );
  } else lines.push(`no project in ${root}`, "");
  lines.push(
    `release ${manifest.version}: ${count(manifest.packs.length, "pack")}, ${count(manifest.components.length, "component")}`,
  );
  for (const p of manifest.packs) {
    const libs = Object.entries({ ...p.libraries, ...p.devLibraries }).map(([n, v]) => `${n}@${v}`);
    const html = typeof p.html === "string" ? p.html : `partial (${p.html.partial})`;
    const mine = manifest.components.filter((c) => c.pack === p.id);
    lines.push(
      `pack ${p.id}${state?.packs.includes(p.id) ? " (installed)" : ""}: ${p.description}`,
      `  requires: ${p.requires.join(", ") || "nothing"}; libraries: ${libs.join(", ") || "none"}; HTML kit: ${html}; components: ${mine.length}`,
    );
    if (input.components) for (const c of mine) lines.push(`  - ${c.id}: ${c.name} (HTML kit: ${c.html})`);
  }
  lines.push(`shells: ${shellNames(manifest).join(", ") || "none"}`);
  lines.push(`skins: ${manifest.skins.map((s) => s.id).join(", ")}`);
  lines.push(`palettes: ${manifest.palettes.map((p) => p.id).join(", ")}`);
  return {
    data: {
      installed: state
        ? {
            version: state.tailor,
            kit: state.kit,
            shell: state.shell ?? null,
            packs: state.packs,
            theme: state.theme,
          }
        : null,
      release: {
        version: manifest.version,
        packs: manifest.packs.map((p) => ({
          ...p,
          ...(input.components
            ? {
                components: manifest.components
                  .filter((c) => c.pack === p.id)
                  .map((c) => ({ id: c.id, name: c.name, html: c.html })),
              }
            : {}),
        })),
        shells: shellNames(manifest),
        skins: manifest.skins,
        palettes: manifest.palettes,
      },
      notes,
    },
    lines,
  };
}

export interface IconsInput extends ReleaseInput {
  readonly dir?: string;
  readonly scan?: readonly string[];
  readonly add?: readonly string[];
}

export async function icons(ctx: Context, input: IconsInput): Promise<Output> {
  const root = folderOf(ctx, input.dir);
  const before = await requireState(root);
  const notes: string[] = [];
  const release = await releaseOf(ctx, input, before.source, before.tailor, notes);
  const after: State = {
    ...before,
    icons: {
      scan: input.scan ?? before.icons.scan,
      add: [...new Set([...before.icons.add, ...(input.add ?? [])])].sort(),
    },
  };
  const path = `${publicRoot(after)}/icons.svg`;
  const data = await sprite(root, after, release);
  const project = new Project(root);
  const recorded = before.files[path] ? { [path]: before.files[path] } : {};
  const steps = planFiles(new Map([[path, sha256(data)]]), recorded, await diskHashes(project, [path]));
  await applyPlan(project, steps, new Map([[path, made(data)]]), stopAt(tailorRoots(after)));
  const { [path]: _old, ...others } = before.files;
  const state: State = { ...after, files: { ...others, ...recordAfter(steps) } };
  await project.write(STATE_FILE, formatState(state));
  const symbols = (data.match(/<symbol /g) ?? []).length;
  const summary = summarize(steps);
  const lines = [
    ...notes,
    `icons: ${symbols}`,
    summary.kept.length
      ? `kept (edited by the project): ${path}; the new sprite is in ${path}.new`
      : `written: ${path}`,
  ];
  return { data: { icons: symbols, path, scan: state.icons.scan, add: state.icons.add, ...summary }, lines };
}

/** The version of the command itself. */
export async function commandVersion(): Promise<string> {
  const pkg = (await Bun.file(resolve(import.meta.dir, "../package.json")).json()) as { version: string };
  return pkg.version;
}
