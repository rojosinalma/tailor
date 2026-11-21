# Contributing

## Run it

```sh
bun install
bin/build            # stylesheets, HTML kit scripts, manifest, the showcase site
bun bin/lib/serve.ts # the showcase at http://127.0.0.1:4173
bin/check            # the checks for what you changed
```

The browser checks start one container with a pinned Chromium (`mcr.microsoft.com/playwright`), so Docker
must run.

## Where things are

[docs/SDD.md](docs/SDD.md) describes the model and the repository. [docs/authoring.md](docs/authoring.md)
is the guide for writing a component, a shell, a skin or a palette; the checks enforce its rules.

## Add something

1. **A component:** a folder per kit as the authoring guide says (spec, stylesheet, React component,
   examples, and for behaviour an HTML kit script and behaviour tests). `bun bin/lib/gen.ts` tells you what
   is missing. It works in every skin and palette without more work.
2. **A shell:** a pack `shell-<name>` with one component, on top of `shell-base`. Its examples show it as a
   full UI.
3. **A skin:** `core/skins/<id>/skin.json` and `extras.css`. Settings first; extras only for looks that no
   setting covers.
4. **A palette:** `core/palettes/src/<id>.json` with a dark and a light set. Colour values only, with the
   source and its licence in the file.
5. **A pack:** an entry in `core/src/packs.ts` with its requirements and libraries. A new library needs a
   line in the design decisions of [docs/SDD.md](docs/SDD.md) and an exact version.

## Checks

`bin/check` runs lint, types, the stylesheet and skin rules, unit tests, the build, and the browser checks
for the components you changed. `bin/check --release` runs everything. A new or changed image is accepted
with `--update-images` after you looked at it in `checks/.images/`.

`bin/agent-check` is the agent build test: an agent builds each brief of `checks/agent/briefs/` from the
release and its reference alone, and the page checks run on its result. It needs the `opencode` command and
takes several minutes per brief, so it runs before a release, not on every change.

## Commits and releases

Plain descriptive commit messages. Commits and tags are signed. Versions follow semver: a change to a
contract ([docs/SDD.md](docs/SDD.md) §4) is a major version and gets an entry in `docs/breaking.json` with
the steps for a project that upgrades. Every release has a tag, a changelog section and a release with the
built artifact.
