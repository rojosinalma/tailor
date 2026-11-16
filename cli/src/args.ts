/** The command line: the commands, their options and the parser. The help text comes from the same table. */
import { UsageError } from "./errors";

interface OptionSpec {
  readonly value?: string;
  readonly about: string;
}

interface CommandSpec {
  readonly usage: string;
  readonly about: string;
  /** Names of the positional arguments, in order. */
  readonly positionals: readonly string[];
  readonly required?: number;
  readonly options: Readonly<Record<string, OptionSpec>>;
}

const RELEASE_OPTIONS: Readonly<Record<string, OptionSpec>> = {
  from: { value: "path", about: "take the release from a folder or a .tgz file" },
  offline: { about: "never download; use the local release store only" },
};

const COMMON: Readonly<Record<string, OptionSpec>> = {
  json: { about: "print one JSON object instead of text" },
  verbose: { about: "print every path" },
  help: { about: "show the help of the command" },
};

export const COMMANDS: Readonly<Record<string, CommandSpec>> = {
  add: {
    usage: "tailor add [dir] --kit react|html [options]",
    about: "Adds tailor to a project, or adds packs or a shell to it.",
    positionals: ["dir"],
    options: {
      kit: { value: "react|html", about: "the kit (first use only)" },
      shell: { value: "name", about: "the shell: one of the release's shells (topnav, sidenav, …)" },
      packs: { value: "a,b,…", about: "packs to add; their requirements come along" },
      version: { value: "X", about: "the release version (default: the installed one, else the latest)" },
      key: { value: "name", about: "prefix of the stored theme choice (default: the folder name)" },
      "default-skin": { value: "id", about: "the skin a first visit gets" },
      "default-palette": { value: "id", about: "the palette a first visit gets" },
      mode: { value: "auto|dark|light", about: "the mode a first visit gets (default: auto)" },
      public: { value: "dir", about: "the folder the web server serves (default: public)" },
      vendor: { value: "dir", about: "the folder for the React kit source (default: vendor)" },
      base: { value: "url", about: "the address of tailor/css/ on the site (default: /tailor/css/)" },
      "replace-shell": { about: "replace the installed shell with the one named by --shell" },
      ...RELEASE_OPTIONS,
    },
  },
  upgrade: {
    usage: "tailor upgrade [dir] [--to X] [--yes]",
    about: "Shows what an upgrade changes; applies it with --yes.",
    positionals: ["dir"],
    options: {
      to: { value: "X", about: "the target version (default: the latest)" },
      yes: { about: "apply the upgrade" },
      force: { about: "go on even when the tailor folders have uncommitted changes" },
      ...RELEASE_OPTIONS,
    },
  },
  remove: {
    usage: "tailor remove <pack> [dir] [--yes]",
    about: "Shows what removing a pack removes; removes it with --yes.",
    positionals: ["pack", "dir"],
    required: 1,
    options: {
      yes: { about: "remove the files" },
      force: { about: "go on even when the tailor folders have uncommitted changes" },
      ...RELEASE_OPTIONS,
    },
  },
  list: {
    usage: "tailor list [dir] [--components]",
    about: "Shows what is installed and what the release has.",
    positionals: ["dir"],
    options: {
      components: { about: "list the components of each pack" },
      version: { value: "X", about: "the release to describe when there is no project" },
      ...RELEASE_OPTIONS,
    },
  },
  icons: {
    usage: "tailor icons [dir] [--scan globs] [--add names]",
    about: "Builds the icon sprite again from the icon names in the project's source files.",
    positionals: ["dir"],
    options: {
      scan: { value: "glob,…", about: "the files to read for icon names (stored)" },
      add: { value: "name,…", about: "icons to include always, such as bi:house (stored)" },
      ...RELEASE_OPTIONS,
    },
  },
  help: {
    usage: "tailor help [command]",
    about: "Shows the help.",
    positionals: ["command"],
    options: {},
  },
};

export type Options = Readonly<Record<string, string | true>>;

export interface Parsed {
  readonly command: string;
  readonly positionals: readonly string[];
  readonly options: Options;
}

/** Parses the arguments after the program name. Throws UsageError on anything it does not know. */
export function parseArgs(argv: readonly string[]): Parsed {
  const [first, ...rest] = argv;
  if (first === undefined || first === "-h" || first === "--help")
    return { command: "help", positionals: [], options: {} };
  if (first === "--version" || first === "-v") return { command: "version", positionals: [], options: {} };
  const spec = COMMANDS[first];
  if (!spec) throw new UsageError(`Unknown command "${first}". Run "tailor help" for the list.`);
  const known: Readonly<Record<string, OptionSpec>> = { ...spec.options, ...COMMON };
  const positionals: string[] = [];
  const options: Record<string, string | true> = {};
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i] ?? "";
    if (arg === "-h") {
      options.help = true;
      continue;
    }
    if (!arg.startsWith("--")) {
      positionals.push(arg);
      continue;
    }
    const eq = arg.indexOf("=");
    const name = arg.slice(2, eq === -1 ? undefined : eq);
    const option = known[name];
    if (!option)
      throw new UsageError(`Unknown option --${name} for "tailor ${first}". Run "tailor help ${first}".`);
    if (name in options) throw new UsageError(`--${name} is given twice.`);
    if (!option.value) {
      if (eq !== -1) throw new UsageError(`--${name} takes no value.`);
      options[name] = true;
      continue;
    }
    const value = eq === -1 ? rest[++i] : arg.slice(eq + 1);
    if (value === undefined || value === "" || (eq === -1 && value.startsWith("--")))
      throw new UsageError(`--${name} needs a value: --${name} ${option.value}`);
    options[name] = value;
  }
  if (!options.help) {
    if (positionals.length > spec.positionals.length)
      throw new UsageError(`Too many arguments. Usage: ${spec.usage}`);
    if (positionals.length < (spec.required ?? 0))
      throw new UsageError(`Missing an argument. Usage: ${spec.usage}`);
  }
  return { command: first, positionals, options };
}

/** A text option, or undefined. */
export const text = (options: Options, name: string): string | undefined => {
  const value = options[name];
  return typeof value === "string" ? value : undefined;
};

/** A comma-separated option as a list, or undefined. */
export const list = (options: Options, name: string): string[] | undefined =>
  text(options, name)
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);

/** A text option that must be one of the allowed values. */
export function choice<const T extends string>(
  options: Options,
  name: string,
  allowed: readonly T[],
): T | undefined {
  const value = text(options, name);
  if (value === undefined) return undefined;
  if (!(allowed as readonly string[]).includes(value))
    throw new UsageError(`--${name} must be one of: ${allowed.join(", ")} (got "${value}").`);
  return value as T;
}

export function helpText(command?: string): string {
  if (command) {
    const spec = COMMANDS[command];
    if (!spec) throw new UsageError(`Unknown command "${command}".`);
    const options = { ...spec.options, ...COMMON };
    const width = Math.max(
      ...Object.entries(options).map(([n, o]) => n.length + (o.value ? o.value.length + 1 : 0)),
    );
    return [
      `Usage: ${spec.usage}`,
      "",
      spec.about,
      "",
      "Options:",
      ...Object.entries(options).map(([name, o]) => {
        const left = `--${name}${o.value ? ` ${o.value}` : ""}`;
        return `  ${left.padEnd(width + 3)}  ${o.about}`;
      }),
    ].join("\n");
  }
  const width = Math.max(...Object.keys(COMMANDS).map((n) => n.length));
  return [
    "Usage: tailor <command> [dir] [options]",
    "",
    "Commands:",
    ...Object.entries(COMMANDS).map(([name, spec]) => `  ${name.padEnd(width)}  ${spec.about}`),
    "",
    "The folder defaults to the current one. Every command takes --json.",
    'Run "tailor help <command>" for its options; "tailor --version" for the version.',
  ].join("\n");
}
