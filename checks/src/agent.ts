/**
 * The agent build test (bin/agent-check): what is checked on a page that an agent built from tailor in a
 * project of its own. The page goes through the same page rules as the showcase (`inspect`, axe, page
 * errors), and the project's own files are read for what tailor's reference forbids: colours and sizes of
 * their own, and rules that restyle tailor's parts.
 */
import { mkdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { Glob } from "bun";
import type { Browser } from "playwright";
import postcss from "postcss";
import { colorFindings } from "../../bin/lib/lint-css";
import { at } from "../../bin/lib/paths";
import { FIXED_NOW } from "./browser";
import { AXE_TAGS, inspect, SCREENS, type Screen, settle, TOUCH } from "./pages";

export type Kit = "html" | "react";

export interface Brief {
  readonly id: string;
  readonly kit: Kit;
  /** The names of buttons that open a part of the page (a dialog); each is checked open too. */
  readonly open: readonly string[];
  /** What the owner asks for: the text the agent gets. */
  readonly text: string;
}

/**
 * Reads a brief: a first line `<!-- kit: html; open: Add device -->` (the parts to open are separated by
 * commas), then the text. A comment, because the formatter rewrites a front matter.
 */
export function parseBrief(id: string, source: string): Brief {
  const match = /^<!--([\s\S]*?)-->\n([\s\S]*)$/.exec(source);
  if (!match) throw new Error(`brief ${id}: no first line <!-- kit: … -->`);
  const fields = Object.fromEntries(
    (match[1] ?? "").split(";").map((part) => {
      const [key = "", ...rest] = part.split(":");
      return [key.trim(), rest.join(":").trim()];
    }),
  );
  const kit = fields.kit;
  if (kit !== "html" && kit !== "react") throw new Error(`brief ${id}: kit must be html or react`);
  const open = fields.open
    ? fields.open
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  return { id, kit, open, text: (match[2] ?? "").trim() };
}

/** The reference that the agent reads first, relative to its project. */
export const referencePath = (kit: Kit): string =>
  kit === "html" ? "public/tailor/REFERENCE.md" : "vendor/tailor/REFERENCE.md";

/** The prompt: the brief, the place of the result, nothing about tailor's insides. */
export function prompt(brief: Brief): string {
  const build =
    brief.kit === "react"
      ? " For the React kit, build it with bun so that the result is static files in public/."
      : "";
  return `${brief.text}

Build this UI with the tailor files in this folder; read ${referencePath(brief.kit)} first. Write the page to public/index.html: the site root is public/, so every file that the page loads must be under public/.${build} Do not ask questions.`;
}

export interface Problem {
  readonly rule: string;
  readonly message: string;
  /** Where it shows: a state of the page, or a file and line. */
  readonly where: string;
}

// ---------------------------------------------------------------------------------------------------------
// The project's own files

/** A length written as a number: what the skins and the layout parts set, never the page. */
const LENGTH = /(?<![\w#-])-?\d*\.?\d+(?:px|rem|em|vh|vw|vmin|vmax|ch|pt|cm|mm|in)\b/;
/** The properties of space and size. A length elsewhere (a border width, a grid line) is not looked at. */
const SIZE_PROPS =
  /^(?:margin|padding|gap|row-gap|column-gap|width|height|min-width|min-height|max-width|max-height|font-size|line-height|top|right|bottom|left|inset)(?:-|$)/;
/** The same in a React style object. */
const JSX_SIZE =
  /\b(?:margin\w*|padding\w*|gap|rowGap|columnGap|width|height|minWidth|minHeight|maxWidth|maxHeight|fontSize|lineHeight|top|right|bottom|left|inset)\s*:\s*["'`]?-?\d/;

/** The findings in one CSS declaration. */
function declarationProblems(prop: string, value: string, where: string): Problem[] {
  const problems: Problem[] = [];
  if (prop.startsWith("--")) return problems;
  for (const f of colorFindings(value))
    problems.push({ rule: "own-colour", message: `${prop}: ${value.trim()} (${f.message})`, where });
  if (SIZE_PROPS.test(prop.toLowerCase()) && LENGTH.test(value))
    problems.push({
      rule: "own-size",
      message: `${prop}: ${value.trim()}: spacing and sizes come from tailor's parts`,
      where,
    });
  return problems;
}

/** The findings in a stylesheet of the project. */
export function cssProblems(file: string, css: string, firstLine = 1): Problem[] {
  const problems: Problem[] = [];
  let root: postcss.Root;
  try {
    root = postcss.parse(css, { from: file });
  } catch (error) {
    return [{ rule: "css-error", message: String(error), where: file }];
  }
  root.walkDecls((d) => {
    const where = `${file}:${(d.source?.start?.line ?? 1) + firstLine - 1}`;
    problems.push(...declarationProblems(d.prop, d.value, where));
  });
  root.walkRules((r) => {
    if (/\.t-[\w-]/.test(r.selector))
      problems.push({
        rule: "tailor-class",
        message: `"${r.selector}" restyles a part of tailor; use its props and parts`,
        where: `${file}:${(r.source?.start?.line ?? 1) + firstLine - 1}`,
      });
  });
  return problems;
}

const lineAt = (text: string, index: number): number => text.slice(0, index).split("\n").length;

/** The findings in a markup or script file: its style blocks, style attributes and React style objects. */
export function markupProblems(file: string, text: string): Problem[] {
  const problems: Problem[] = [];
  for (const m of text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
    problems.push(...cssProblems(file, m[1] ?? "", lineAt(text, m.index ?? 0)));
  }
  for (const m of text.matchAll(/\sstyle="([^"]*)"/g)) {
    const where = `${file}:${lineAt(text, m.index ?? 0)}`;
    for (const decl of (m[1] ?? "").split(";")) {
      const [prop = "", ...rest] = decl.split(":");
      if (prop.trim()) problems.push(...declarationProblems(prop.trim(), rest.join(":"), where));
    }
  }
  // A tailor icon with a drawing of its own: a glyph copied from the reference, where the sprite has it.
  for (const m of text.matchAll(/<svg\b[^>]*class="t-icon"[^>]*>\s*<(?:path|g)\b/g))
    problems.push({
      rule: "own-glyph",
      message:
        'a t-icon with its own drawing; use the sprite: <use href="/tailor/icons.svg#t-close"> for a glyph of tailor, #bi-<name> for an icon',
      where: `${file}:${lineAt(text, m.index ?? 0)}`,
    });
  // A shell fit into a preview box: an app's shell fills the screen.
  for (const m of text.matchAll(/data-contained|<[A-Z]\w*Shell\b[^<>]*?\scontained(?=[\s/>=])/g))
    problems.push({
      rule: "contained",
      message: "a shell with contained: that is for a preview in a box; an app's shell fills the screen",
      where: `${file}:${lineAt(text, m.index ?? 0)}`,
    });
  // The links of a top bar or a side column written again for the drawer or "More": the scripts build both
  // from the links the page wrote once. (The bottom bar form still writes its drawer.)
  const shell = /data-shell="(?:topnav|sidenav)"/.test(text) && !/class="t-bottom-bar"/.test(text);
  for (const m of shell ? text.matchAll(/class="t-drawer t-nav-drawer"|class="t-topnav-more"/g) : [])
    problems.push({
      rule: "links-twice",
      message: `${m[0]}: write the links once, in the bar's list or the side column; the script builds the drawer and "More"`,
      where: `${file}:${lineAt(text, m.index ?? 0)}`,
    });
  // A busy button of its own: the form, Tailor.busy and the React Button's loading do it.
  const scripts = /\.(m?js|jsx?|tsx?)$/.test(file)
    ? [{ body: text, at: 0 }]
    : [...text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map((m) => ({
        body: m[1] ?? "",
        at: (m.index ?? 0) + m[0].indexOf(">") + 1,
      }));
  // A button's busy state, by name (btn, button, submit): a region marked busy while it loads is fine.
  for (const { body, at } of scripts)
    for (const m of body.matchAll(
      /t-btn-spinner|\b\w*(?:btn|button|submit)\w*\s*\.\s*(?:(?:set|remove|get|has)Attribute\(\s*["']aria-busy|ariaBusy)/gi,
    ))
      problems.push({
        rule: "own-busy",
        message: `${m[0].slice(0, 40)}… in a script: use Tailor.busy(button, on), a form with data-t-submit="fetch", or Button loading`,
        where: `${file}:${lineAt(text, at + (m.index ?? 0))}`,
      });
  for (const m of text.matchAll(/\bstyle=\{\{([\s\S]*?)\}\}/g)) {
    const body = m[1] ?? "";
    const where = `${file}:${lineAt(text, m.index ?? 0)}`;
    for (const f of colorFindings(body)) problems.push({ rule: "own-colour", message: f.message, where });
    if (JSX_SIZE.test(body) || LENGTH.test(body))
      problems.push({
        rule: "own-size",
        message: `style={{${body.trim().slice(0, 60)}}}: spacing and sizes come from tailor's parts`,
        where,
      });
  }
  return problems;
}

/** The project's own files: everything but tailor's copy, the libraries, and for the React kit the built site. */
export async function scanProject(dir: string, kit: Kit): Promise<Problem[]> {
  const problems: Problem[] = [];
  const skip = (path: string): boolean =>
    /(^|\/)(node_modules|\.git|\.opencode|dist|build)\//.test(path) ||
    path.startsWith("public/tailor/") ||
    path.startsWith("vendor/tailor/") ||
    (kit === "react" && path.startsWith("public/"));
  for await (const path of new Glob("**/*.{html,css,js,jsx,ts,tsx,mjs}").scan({ cwd: dir, dot: false })) {
    if (skip(path)) continue;
    const text = await Bun.file(join(dir, path)).text();
    problems.push(...(path.endsWith(".css") ? cssProblems(path, text) : markupProblems(path, text)));
  }
  return problems;
}

// ---------------------------------------------------------------------------------------------------------
// The page in the browser

/** The screens of the test: a phone, a tablet by touch, a short desktop window and a large desktop. */
export const AGENT_SCREENS: readonly Screen[] = ["390", "820", "1440x800", "2560"].map((name) => {
  const screen = SCREENS.find((s) => s.name === name);
  if (!screen) throw new Error(`no screen ${name}`);
  return screen;
});

/** Two skins: the default one and the one with the widest letters and lines (a monospaced font). */
export const AGENT_SKINS = ["bootstrap", "webtui"] as const;
const MODES = ["dark", "light"] as const;

export interface SiteResult {
  readonly problems: Problem[];
  readonly states: number;
  readonly shots: string[];
}

/**
 * Opens the page in every skin, mode and screen, runs the page rules in each, and takes a picture of each.
 * A button named in `open` is pressed and the page is checked again with that part open.
 */
export async function inspectSite(
  browser: Browser,
  url: string,
  open: readonly string[],
  shotsDir: string,
): Promise<SiteResult> {
  const problems: Problem[] = [];
  const shots: string[] = [];
  let states = 0;
  await mkdir(shotsDir, { recursive: true });
  for (const touch of [true, false]) {
    const screens = AGENT_SCREENS.filter((s) => s.touch === touch);
    const first = screens[0];
    if (!first) continue;
    for (const skin of AGENT_SKINS) {
      for (const mode of MODES) {
        const context = await browser.newContext({
          viewport: { width: first.width, height: first.height },
          hasTouch: touch,
          isMobile: touch,
          reducedMotion: "reduce",
          colorScheme: mode,
          locale: "en-US",
          timezoneId: "UTC",
        });
        await context.addInitScript({ content: `window.__inspect = ${inspect.toString()};` });
        const page = await context.newPage();
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(String(error)));
        page.on("console", (message) => {
          if (message.type() === "error") errors.push(message.text());
        });
        page.on("response", (response) => {
          if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
        });
        const label = (screen: Screen, part = "") =>
          `${skin} ${mode} ${screen.name}${part ? ` (${part} open)` : ""}`;
        const check = async (screen: Screen, part: string): Promise<void> => {
          states++;
          await settle(page);
          const found = await page.evaluate(
            ([isTouch, size]) =>
              (window as unknown as { __inspect: typeof inspect }).__inspect(isTouch, size),
            [touch, TOUCH] as const,
          );
          for (const f of found) problems.push({ ...f, where: label(screen, part) });
          const name = `${skin}-${mode}-${screen.name}${part ? `-${part.toLowerCase().replace(/\W+/g, "-")}` : ""}.png`;
          await page.screenshot({
            path: join(shotsDir, name),
            fullPage: true,
            animations: "disabled",
            caret: "hide",
          });
          shots.push(name);
        };
        try {
          await page.clock.setFixedTime(FIXED_NOW);
          await page.goto(`${url}?skin=${skin}&palette=gruvbox&mode=${mode}`, { waitUntil: "load" });
          await page.locator("body *").first().waitFor({ timeout: 10_000 });
          await page
            .locator(".t-shell")
            .first()
            .waitFor({ timeout: 5_000 })
            .catch(() =>
              problems.push({
                rule: "no-shell",
                message: "the page has no tailor shell (t-shell): its frame is written by hand",
                where: label(first),
              }),
            );
          for (const screen of screens) {
            await page.setViewportSize({ width: screen.width, height: screen.height });
            await check(screen, "");
            for (const name of open) {
              const button = page.getByRole("button", { name, exact: true }).first();
              if ((await button.count()) === 0 || !(await button.isVisible())) {
                problems.push({
                  rule: "missing-part",
                  message: `no button named "${name}" on the page`,
                  where: label(screen),
                });
                continue;
              }
              await button.click();
              await page.waitForTimeout(400);
              await check(screen, name);
              await page.keyboard.press("Escape");
              await page.waitForTimeout(300);
            }
          }
          if (!touch) {
            await page.setViewportSize({ width: first.width, height: first.height });
            await page.addScriptTag({ path: at("node_modules/axe-core/axe.min.js") });
            const violations = await page.evaluate(async (tags) => {
              const axe = (
                window as unknown as {
                  axe: {
                    run: (
                      d: Document,
                      o: object,
                    ) => Promise<{
                      violations: { id: string; help: string; nodes: { target: string[] }[] }[];
                    }>;
                  };
                }
              ).axe;
              const result = await axe.run(document, { runOnly: tags, resultTypes: ["violations"] });
              return result.violations.map((v) => ({
                id: v.id,
                help: v.help,
                targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")),
              }));
            }, AXE_TAGS);
            for (const v of violations)
              problems.push({
                rule: `axe:${v.id}`,
                message: `${v.help} (${v.targets.join("; ")})`,
                where: `${skin} ${mode}`,
              });
          }
        } catch (error) {
          errors.push(error instanceof Error ? (error.message.split("\n")[0] ?? "") : String(error));
        } finally {
          await context.close();
        }
        for (const error of errors)
          problems.push({ rule: "page-error", message: error, where: `${skin} ${mode}` });
      }
    }
  }
  return { problems, states, shots };
}

/** Problems of one kind and message, with the places where each shows. */
export function grouped(problems: readonly Problem[]): { rule: string; message: string; where: string[] }[] {
  const seen = new Map<string, { rule: string; message: string; where: string[] }>();
  for (const p of problems) {
    const key = `${p.rule}|${p.message}`;
    const entry = seen.get(key) ?? { rule: p.rule, message: p.message, where: [] };
    if (!entry.where.includes(p.where)) entry.where.push(p.where);
    seen.set(key, entry);
  }
  return [...seen.values()];
}

export const relativeToRepo = (path: string): string => relative(at("."), path);
