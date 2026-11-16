#!/usr/bin/env bun
/** The tailor command: adds tailor to a project, upgrades it, removes packs, lists, builds the icon sprite. */
import { choice, helpText, list, type Options, parseArgs, text } from "./args";
import {
  add,
  type Context,
  commandVersion,
  icons,
  list as listCommand,
  type Output,
  remove,
  upgrade,
} from "./commands";
import { Problem, UsageError } from "./errors";
import { KITS } from "./manifest";
import { MODES } from "./state";
import { storeDir } from "./store";

const releaseInput = (o: Options) => ({
  ...(text(o, "from") ? { from: text(o, "from") } : {}),
  offline: o.offline === true,
  verbose: o.verbose === true,
});

/** Leaves out the options that were not given, so they do not override stored settings. */
const given = <T extends Record<string, unknown>>(values: T): Partial<T> =>
  Object.fromEntries(Object.entries(values).filter(([, v]) => v !== undefined)) as Partial<T>;

export async function run(
  argv: readonly string[],
  ctx: Context,
): Promise<{ code: number; out: string; err: string }> {
  let json = false;
  try {
    const { command, positionals, options } = parseArgs(argv);
    json = options.json === true;
    if (command === "version") return { code: 0, out: `${await commandVersion()}\n`, err: "" };
    if (command === "help" || options.help === true) {
      const topic = command === "help" ? positionals[0] : command;
      return { code: 0, out: `${helpText(topic)}\n`, err: "" };
    }
    const [first, second] = positionals;
    let result: Output;
    switch (command) {
      case "add":
        result = await add(ctx, {
          ...releaseInput(options),
          ...given({
            dir: first,
            kit: choice(options, "kit", KITS),
            shell: text(options, "shell"),
            packs: list(options, "packs"),
            version: text(options, "version"),
            key: text(options, "key"),
            skin: text(options, "default-skin"),
            palette: text(options, "default-palette"),
            mode: choice(options, "mode", MODES),
            public: text(options, "public"),
            vendor: text(options, "vendor"),
            base: text(options, "base"),
          }),
          replaceShell: options["replace-shell"] === true,
        });
        break;
      case "upgrade":
        result = await upgrade(ctx, {
          ...releaseInput(options),
          ...given({ dir: first, to: text(options, "to") }),
          yes: options.yes === true,
          force: options.force === true,
        });
        break;
      case "remove":
        result = await remove(ctx, {
          ...releaseInput(options),
          pack: first ?? "",
          ...given({ dir: second }),
          yes: options.yes === true,
          force: options.force === true,
        });
        break;
      case "list":
        result = await listCommand(ctx, {
          ...releaseInput(options),
          ...given({ dir: first, version: text(options, "version") }),
          components: options.components === true,
        });
        break;
      case "icons":
        result = await icons(ctx, {
          ...releaseInput(options),
          ...given({ dir: first, scan: list(options, "scan"), add: list(options, "add") }),
        });
        break;
      default:
        throw new UsageError(`Unknown command "${command}".`);
    }
    return {
      code: 0,
      out: json ? `${JSON.stringify(result.data, null, 2)}\n` : `${result.lines.join("\n")}\n`,
      err: "",
    };
  } catch (error) {
    const code = error instanceof UsageError ? 2 : 1;
    const message = error instanceof Error ? error.message : String(error);
    const fix = error instanceof Problem ? error.fix : undefined;
    if (!(error instanceof UsageError || error instanceof Problem) && error instanceof Error && error.stack)
      return { code, out: "", err: `error: ${error.stack}\n` };
    if (json)
      return {
        code,
        out: `${JSON.stringify({ error: message, ...(fix ? { fix } : {}) }, null, 2)}\n`,
        err: "",
      };
    return { code, out: "", err: `error: ${message}\n${fix ? `fix: ${fix}\n` : ""}` };
  }
}

export async function main(): Promise<never> {
  const result = await run(process.argv.slice(2), { cwd: process.cwd(), store: storeDir() });
  if (result.out) process.stdout.write(result.out);
  if (result.err) process.stderr.write(result.err);
  process.exit(result.code);
}

if (import.meta.main) await main();
