# The `tailor` command

A project that uses tailor keeps its own copy of tailor's files. The `tailor` command puts that copy in place,
upgrades it when the project's owner asks for it, and removes packs. It works on the one folder it runs in,
keeps its record in that folder (`tailor.json`), and never edits the project's own files, runs the project's
tools or makes a commit.

Run it with Bun from a checkout of the repository:

```sh
bin/tailor <command> [dir] [options]      # or: bun cli/src/main.ts …
```

Every command takes the project folder as an argument; the default is the current folder.

## Commands

| Command                                           | What it does                                                   |
| ------------------------------------------------- | -------------------------------------------------------------- |
| `tailor add [dir] --kit react\|html [options]`    | Adds tailor to a project, or adds packs or a shell to it       |
| `tailor upgrade [dir] [--to X] [--yes]`           | Shows what an upgrade changes; applies it with `--yes`         |
| `tailor remove <pack> [dir] [--yes]`              | Shows what removing a pack removes; removes it with `--yes`    |
| `tailor list [dir] [--components]`                | Shows what is installed and what the release has               |
| `tailor icons [dir] [--scan globs] [--add names]` | Builds the icon sprite again from the icon names in the source |
| `tailor help [command]`, `tailor --version`       | The help, and the version of the command                       |

Options that every command takes:

1. `--json`: one JSON object instead of text. An error is `{ "error": …, "fix": … }`.
2. `--verbose`: every path, not only the counts.
3. `--from <path>`: take the release from a folder or a `.tgz` file instead of the store or a download.
4. `--offline`: never download.
5. `--pre` (`add`, `upgrade`, `list`): when no version is named, a pre-release (such as `2.0.0-rc.1`) may be
   picked. Without it, a pre-release is picked only when the project already has one.

Exit codes: `0` done, `1` a problem (the message says what is wrong, the line `fix:` says what to do),
`2` wrong use of the command. The text output has one fact per line and no colour.

### `add`

```sh
tailor add --kit html --shell topnav --packs forms
tailor add --kit react --packs charts,code --default-skin primer --default-palette nord --mode dark
tailor add --packs markdown          # later: adds a pack to what is there
```

1. The first use in a folder needs `--kit`. Later uses take the kit, the folders and the version from
   `tailor.json`, and add packs or a shell to what is there.
2. `core` comes always, and every pack brings the packs it requires.
3. A pack that the HTML kit does not have is an error with `--kit html`. A pack that the HTML kit has in part
   is added with a note that says which part.
4. A project has one shell. A different `--shell` replaces the installed one only with `--replace-shell`.
5. Options:
   - a. `--shell <name>`: one of the release's shells (`tailor list` names them).
   - b. `--packs a,b,…`: the packs to add.
   - c. `--version X`: the release version on the first use (default: the latest). To change the version
     later, use `upgrade`.
   - d. `--key <name>`: prefix of the theme choice that the browser stores (default: the folder name).
   - e. `--default-skin <id>`, `--default-palette <id>`, `--mode auto|dark|light`: what a first visit gets.
   - f. `--public <dir>` (default `public`), `--vendor <dir>` (default `vendor`): where the files go.
   - g. `--base <url>`: the address of `tailor/css/` on the site (default `/tailor/css/`). The scripts are
     expected next to it, in `tailor/js/`.
6. It prints the files written (a count per folder), the lines for `<head>`, and for the React kit the
   `bun add …` line with the pinned libraries, a `bun add -d …` line with their type packages, and the way to
   import the kit.

What it writes:

```
tailor.json                         the record (below)
<public>/tailor/
  css/tailor.css                    core
  css/tailor-<pack>.css             the installed packs and the shell
  css/skins/*.css, palettes/*.css   every skin and every palette, so the theme can switch
  css/fonts/…                       fonts of the skins that carry them
  icons.svg                         the icon sprite of the project
  head.html                         the lines for <head>
  LICENSE
  js/tailor.js, js/tailor-<pack>.js           HTML kit only
  js/tailor-sw.js                             with the pwa pack, in both kits
  reference/<pack>/<component>.html           HTML kit only: the markup of every example
  REFERENCE.md, reference/<pack>.md           HTML kit only: the reference (below)
  THIRD-PARTY.md                              HTML kit only
<vendor>/tailor/                    React kit only: the kit as source, the installed packs only
  core/, <pack>/                    the components; <pack>/index.ts is what an import names
  kit/, lib/                        shared code
  package.json                      name "tailor", one export per pack, the libraries as peers
  REFERENCE.md, reference/<pack>.md the reference (below)
  LICENSE
```

The service worker script `tailor-sw.js` of the `pwa` pack goes to `<public>/tailor/js/` in both kits: the
HTML kit loads it from there, and a React app serves a small `sw.js` of its own that imports it.

The reference for agents is in two levels: `REFERENCE.md` is a short index (how to use tailor, then one line
per component of the installed packs), and `reference/<pack>.md` holds the full entry of each component of
that pack: its import, classes, props with their allowed values, and its first example in each kit.

In `package.json`, the type packages (`@types/…`) are optional peer dependencies: the project compiles this
source with its own TypeScript, so the project must have them, and a project without TypeScript needs none.
A vendored package's dev dependencies are never installed, so they would not help.

The React kit is plain TypeScript with relative imports. Make the name `tailor` point at it in one of two ways:

1. A dependency: `"tailor": "file:./vendor/tailor"` in `package.json` (or a workspace entry), then
   `bun install`.
2. A path: `"paths": { "tailor/*": ["./vendor/tailor/*"] }` in `tsconfig.json`, and the same alias in the
   bundler.

Then `import { Button } from "tailor/core";`, `import { LineChart } from "tailor/charts";`.

### The lines for `<head>`

`<public>/tailor/head.html` holds, in order: the viewport `<meta>`, a script that sets the skin, palette and
mode before the first paint (and writes the links of the skin and palette stylesheets), `window.TAILOR_THEME`
with every skin and palette and their names, the stylesheet links (core, the packs, the shell), and for the
HTML kit the `defer` scripts. Paste them into the `<head>` of every page, or include the file from a template.

### `upgrade`

```sh
tailor upgrade                 # preview: to the latest version
tailor upgrade --to 2.1.0      # preview: to a named version
tailor upgrade --yes           # apply
```

1. Without `--yes` it only shows: the current and the target version, the counts of files to add, change and
   remove (`--verbose`: the paths), the files the project edited, the changelog lines and every breaking
   change between the two versions with its steps. It writes nothing.
2. With `--yes` it applies the upgrade. A file the project edited (its hash differs from the one in
   `tailor.json`) is never overwritten: the new version goes next to it as `<name>.new`. A file that the new
   version no longer has is removed, unless the project edited it.
3. In a git work tree, it refuses to apply when the tailor folders or `tailor.json` have uncommitted changes,
   so the upgrade is one clean change to review. `--force` goes on anyway.

### `remove`

`tailor remove charts` shows the files that go; `--yes` removes them. Packs that only this pack required go
too, and the output names them. `core` cannot be removed, nor a pack that another installed pack requires.
Edited files stay and are listed. For the React kit it prints the libraries and the type packages that no
remaining pack needs.

### `list`

The installed version, kit, shell and packs, then what the release has: each pack with its description,
requirements, libraries and HTML kit support; the shells, skins and palettes. `--components` lists the
components of each pack. Outside a project it shows only the release (`--version X` names one).

### `icons`

Builds `<public>/tailor/icons.svg` again. It reads the project's source files for icon names
(`bi:<name>` and `simple-icons:<name>`), adds the names given with `--add`, and writes the sprite. An unknown
name is an error that lists it. `add` and `upgrade` do this too.

1. `--scan glob,…`: the files to read. The default is
   `**/*.{html,erb,tsx,ts,jsx,js,vue,svelte,astro,php,py,rb,templ,j2}`. Folders named `node_modules`,
   `vendor`, `dist` and `.git`, and the tailor folders, are never read.
2. `--add bi:house,…`: icons to include always.

Both are stored in `tailor.json`. This is the only time the command reads the project's own files, and it
only reads them.

## `tailor.json`

The project's record. The command is its only writer; keep it in version control.

```json
{
  "tailor": "2.0.0",
  "source": "github:<owner>/<repo>",
  "kit": "react",
  "shell": "topnav",
  "packs": ["core", "forms", "shell-topnav"],
  "public": "public",
  "vendor": "vendor",
  "theme": {
    "key": "myapp",
    "skin": "bootstrap",
    "palette": "gruvbox",
    "mode": "auto",
    "base": "/tailor/css/"
  },
  "icons": { "scan": ["**/*.{html,tsx}"], "add": ["bi:house"] },
  "files": { "public/tailor/css/tailor.css": "<sha256>" }
}
```

`files` holds the sha256 of every file the command wrote, as it wrote it. That is how it knows which files
the project edited.

## Where a release comes from

In this order:

1. `--from <path>`: a release folder or a `.tgz`.
2. The local release store: `$TAILOR_RELEASES/<version>/`, else `$XDG_CACHE_HOME/tailor/releases/<version>/`,
   else `~/.cache/tailor/releases/<version>/`.
3. A download from the releases of the repository named in `source`
   (`releases/download/v<version>/tailor-<version>.tgz`), checked against its `.sha256` file when the release
   has one, and unpacked into the store, so each version is fetched once.

Without a version, the command takes the latest published release, or the highest version in the store when
that one is newer (a local build). Pre-releases count only with `--pre`, or when the project already has a
pre-release.

The command checks every file of a release against its manifest before it uses it.

## For maintainers: the release artifact

```sh
bun bin/build --release            # dist/release/tailor-<version>/ and tailor-<version>.tgz (+ .sha256)
bun bin/build --release --install  # also copies it into the local release store
```

```
manifest.json      version, packs, components, skins, palettes, default theme, files (sha256, pack, kit),
                   breaking changes, changelog
LICENSE, THIRD-PARTY.md        THIRD-PARTY: the libraries bundled into the HTML kit scripts
css/               tailor.css, tailor-<pack>.css, skins/, palettes/, fonts/
html/              tailor.js, tailor-<pack>.js, tailor-sw.js, head.html (a template),
                   reference/<pack>/<component>.html
react/             kit/, <pack>/<component>/, <pack>/index.ts, lib/core/, lib/packs/, package.json
icons/             bi.json, simple-icons.json (Iconify JSON)
reference/         <pack>.md: the full reference entries of each pack
REFERENCE.md       the index of the reference; reference.json holds all of it as data
```

1. The React kit goes in as source. Every import is rewritten to a relative one, and the build type-checks the
   tree with no path aliases, the way a project compiles its copy. A file that imports from a pack that its
   own pack does not require, or a library that its packs do not list, fails the build.
2. `docs/breaking.json`, when it exists, gives the breaking changes:
   `[{ "version": "3.0.0", "title": "…", "steps": ["…"], "codemod": "name" }]`. `CHANGELOG.md`, when it
   exists, gives the changelog: `## <version>` headings and their `- ` lines.
3. The `.tgz` is deterministic: sorted names, no owners, a fixed time.
