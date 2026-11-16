/**
 * The command end to end, against a small fixture release in two versions, one project per kit:
 * add → list → edit a file → upgrade preview → upgrade --yes → remove a pack. No network: the second
 * version comes from a local server that plays the release host.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { SCRATCH, scratch, writeRelease } from "../test/fixture";
import { add, type Context, list, remove, upgrade } from "./commands";
import { Problem } from "./errors";
import { run } from "./main";
import { sha256 } from "./plan";
import { readState } from "./state";

let base: string;
let v1: string;
let server: ReturnType<typeof Bun.serve>;
let ctx: Context;
const requests: string[] = [];

beforeAll(async () => {
  base = await scratch("e2e");
  v1 = await writeRelease(join(base, "releases"), "1.0.0");
  const v2 = await writeRelease(join(base, "releases"), "2.0.0");
  const tgz = join(base, "tailor-2.0.0.tgz");
  const tar = Bun.spawn(["tar", "-czf", tgz, "-C", join(base, "releases"), "tailor-2.0.0"]);
  expect(await tar.exited).toBe(0);
  await rm(v2, { recursive: true });
  const data = new Uint8Array(await Bun.file(tgz).arrayBuffer());
  server = Bun.serve({
    port: 0,
    fetch(req) {
      const path = new URL(req.url).pathname;
      requests.push(path);
      if (path === "/repos/rojosinalma/tailor/releases/latest") return Response.json({ tag_name: "v2.0.0" });
      if (path === "/rojosinalma/tailor/releases/download/v2.0.0/tailor-2.0.0.tgz") return new Response(data);
      if (path === "/rojosinalma/tailor/releases/download/v2.0.0/tailor-2.0.0.tgz.sha256")
        return new Response(`${sha256(data)}  tailor-2.0.0.tgz\n`);
      if (path === "/rojosinalma/tailor/releases/download/v3.0.0/tailor-3.0.0.tgz") return new Response(data);
      if (path.endsWith("tailor-3.0.0.tgz.sha256"))
        return new Response(`${"0".repeat(64)}  tailor-3.0.0.tgz\n`);
      return new Response("not found", { status: 404 });
    },
  });
  const host = `http://127.0.0.1:${server.port}`;
  ctx = { cwd: base, store: join(base, "store"), endpoints: { web: host, api: host } };
});

afterAll(async () => {
  server.stop(true);
  await rm(SCRATCH, { recursive: true, force: true });
});

const exists = (dir: string, path: string) => existsSync(join(dir, path));
const read = (dir: string, path: string) => Bun.file(join(dir, path)).text();

describe("React kit project", () => {
  const dir = () => join(base, "app-react");

  test("add writes the kit, the stylesheets and the state", async () => {
    await mkdir(join(dir(), "src"), { recursive: true });
    await Bun.write(join(dir(), "src/app.tsx"), '<Icon name="bi:house" />');
    const out = await add(ctx, { dir: "app-react", kit: "react", shell: "top", packs: ["deep"], from: v1 });
    const state = await readState(dir());
    expect(state?.tailor).toBe("1.0.0");
    expect(state?.packs).toEqual(["core", "extra", "deep", "shell-top"]);
    expect(state?.theme.key).toBe("app-react");
    expect(exists(dir(), "vendor/tailor/core/button/button.tsx")).toBe(true);
    expect(exists(dir(), "vendor/tailor/deep/index.ts")).toBe(true);
    expect(exists(dir(), "vendor/tailor/react-only/index.ts")).toBe(false);
    expect(exists(dir(), "public/tailor/css/tailor-extra.css")).toBe(true);
    expect(exists(dir(), "public/tailor/js")).toBe(false);
    expect(await read(dir(), "public/tailor/icons.svg")).toContain('id="bi-house"');
    expect(JSON.parse(await read(dir(), "vendor/tailor/package.json")).exports["./deep"]).toBe(
      "./deep/index.ts",
    );
    expect(out.data.bunAdd).toBe("bun add react@19.0.0 lib-x@1.0.0 lib-y@2.0.0");
    expect(out.lines.join("\n")).toContain("tailor/core");
    expect(Object.keys(state?.files ?? {})).toContain("vendor/tailor/REFERENCE.md");
  });

  test("add again adds nothing new and keeps the shell unless told to replace it", async () => {
    const again = await add(ctx, { dir: "app-react", from: v1 });
    expect(again.data.written).toEqual({});
    await expect(add(ctx, { dir: "app-react", shell: "other", from: v1 })).rejects.toThrow(
      /no shell "other"/,
    );
    await expect(add(ctx, { dir: "app-react", kit: "html", from: v1 })).rejects.toThrow(/has one kit/);
    await expect(add(ctx, { dir: "app-react", offline: true })).rejects.toThrow(/not in the release store/);
  });

  test("list shows the project and the release", async () => {
    const out = await list(ctx, { dir: "app-react", from: v1, components: true });
    const text = out.lines.join("\n");
    expect(text).toContain("installed: tailor 1.0.0");
    expect(text).toContain("pack deep (installed)");
    expect(text).toContain("  - button: Button");
    const none = await list(ctx, { dir: "nowhere", from: v1 });
    expect(none.data.installed).toBeNull();
  });

  test("upgrade preview: counts, edited files, breaking changes; writes nothing", async () => {
    await Bun.write(join(dir(), "public/tailor/css/tailor.css"), "/* mine */");
    const before = await read(dir(), "tailor.json");
    const out = await upgrade(ctx, { dir: "app-react" });
    expect(requests).toContain("/repos/rojosinalma/tailor/releases/latest");
    expect(out.data.applied).toBe(false);
    expect(out.data.to).toBe("2.0.0");
    expect(out.data.kept).toEqual(["public/tailor/css/tailor.css"]);
    expect(out.data.added).toEqual(["vendor/tailor/core/card/card.tsx"]);
    expect(out.data.removed).toEqual(["public/tailor/css/tailor-extra.css"]);
    expect(out.data.changed).toContain("vendor/tailor/core/button/button.tsx");
    const text = out.lines.join("\n");
    expect(text).toContain("breaking change in 2.0.0: Button takes a tone");
    expect(text).toContain("  - release 2.0.0");
    expect(await read(dir(), "tailor.json")).toBe(before);
    expect(exists(dir(), "vendor/tailor/core/card/card.tsx")).toBe(false);
  });

  test("upgrade refuses uncommitted changes in the tailor folders, unless --force", async () => {
    const git = (...args: string[]) =>
      Bun.spawn(["git", "-c", "user.name=alice", "-c", "user.email=alice@example.com", ...args], {
        cwd: dir(),
        stdout: "ignore",
        stderr: "ignore",
      }).exited;
    await git("init", "-q");
    await git("add", ".");
    await git("commit", "-q", "-m", "start");
    await Bun.write(join(dir(), "vendor/tailor/kit/kit.tsx"), "export const kit = 1; // edited\n");
    await expect(upgrade(ctx, { dir: "app-react", yes: true, offline: true })).rejects.toThrow(
      /uncommitted changes/,
    );
    await git("add", ".");
    await git("commit", "-q", "-m", "edit");
  });

  test("upgrade --yes keeps edited files, writes .new next to them, updates the rest", async () => {
    const out = await upgrade(ctx, { dir: "app-react", yes: true, offline: true });
    expect(out.data.applied).toBe(true);
    const state = await readState(dir());
    expect(state?.tailor).toBe("2.0.0");
    expect(await read(dir(), "public/tailor/css/tailor.css")).toBe("/* mine */");
    expect(await read(dir(), "public/tailor/css/tailor.css.new")).toBe(".t-btn{v:2}");
    expect(state?.files["public/tailor/css/tailor.css"]).toBe(sha256(".t-btn{v:1}"));
    expect(await read(dir(), "vendor/tailor/core/button/button.tsx")).toBe("export const Button = 2;\n");
    expect(exists(dir(), "vendor/tailor/core/card/card.tsx")).toBe(true);
    expect(exists(dir(), "public/tailor/css/tailor-extra.css")).toBe(false);
    // The kit file was edited and the release did not change it: kept, no .new.
    expect(exists(dir(), "vendor/tailor/kit/kit.tsx.new")).toBe(false);
    const again = await upgrade(ctx, { dir: "app-react", offline: true });
    expect(again.data.kept).toEqual(["public/tailor/css/tailor.css", "vendor/tailor/kit/kit.tsx"]);
    expect(again.data.changed).toEqual([]);
  });

  test("remove previews, then removes the pack, the packs only it needed, and names the libraries", async () => {
    const preview = await remove(ctx, { dir: "app-react", pack: "deep", offline: true });
    expect(exists(dir(), "vendor/tailor/deep/index.ts")).toBe(true);
    expect(preview.data.packs).toEqual({ removed: ["deep", "extra"], remaining: ["core", "shell-top"] });
    const out = await remove(ctx, { dir: "app-react", pack: "deep", yes: true, force: true, offline: true });
    expect(out.data.libraries).toEqual(["lib-x", "lib-y"]);
    expect(exists(dir(), "vendor/tailor/deep")).toBe(false);
    expect(exists(dir(), "vendor/tailor/extra")).toBe(false);
    expect((await readState(dir()))?.packs).toEqual(["core", "shell-top"]);
    const shell = await remove(ctx, {
      dir: "app-react",
      pack: "shell-top",
      yes: true,
      force: true,
      offline: true,
    });
    expect(shell.data.applied).toBe(true);
    expect((await readState(dir()))?.shell).toBeUndefined();
  });
});

describe("HTML kit project", () => {
  const dir = () => join(base, "site");

  test("a React-only pack is an error that says so; a partial pack gets a note", async () => {
    await expect(add(ctx, { dir: "site", kit: "html", packs: ["react-only"], from: v1 })).rejects.toThrow(
      Problem,
    );
    await expect(add(ctx, { dir: "site", kit: "html", packs: ["react-only"], from: v1 })).rejects.toThrow(
      /React only/,
    );
    const out = await add(ctx, {
      dir: "site",
      kit: "html",
      packs: ["extra"],
      from: v1,
      public: "www",
      mode: "dark",
    });
    expect(out.lines.join("\n")).toContain("the HTML kit has part of the pack extra: the view");
  });

  test("add writes stylesheets, scripts, reference markup and head.html", async () => {
    expect(exists(dir(), "www/tailor/js/tailor.js")).toBe(true);
    expect(exists(dir(), "www/tailor/js/tailor-extra.js")).toBe(true);
    expect(exists(dir(), "www/tailor/reference/core/button.html")).toBe(true);
    expect(exists(dir(), "www/tailor/THIRD-PARTY.md")).toBe(true);
    expect(exists(dir(), "vendor")).toBe(false);
    const head = await read(dir(), "www/tailor/head.html");
    expect(head).toContain('<script defer src="/tailor/js/tailor-extra.js"></script>');
    expect(head).toContain('"mode":"dark"');
  });

  test("upgrade --yes through the command line, then remove a pack", async () => {
    await Bun.write(join(dir(), "www/tailor/css/tailor.css"), "/* mine */");
    const preview = await run(["upgrade", "site", "--offline", "--json"], ctx);
    expect(preview.code).toBe(0);
    expect(JSON.parse(preview.out).kept).toEqual(["www/tailor/css/tailor.css"]);
    const applied = await run(["upgrade", "site", "--offline", "--yes"], ctx);
    expect(applied.code).toBe(0);
    expect(applied.out).toContain("upgraded to 2.0.0");
    expect(await read(dir(), "www/tailor/css/tailor.css.new")).toBe(".t-btn{v:2}");
    const removed = await run(["remove", "extra", "site", "--offline", "--yes"], ctx);
    expect(removed.code).toBe(0);
    expect(exists(dir(), "www/tailor/js/tailor-extra.js")).toBe(false);
    expect(await read(dir(), "www/tailor/head.html")).not.toContain("tailor-extra");
  });

  test("exit codes: 2 for wrong use, 1 for a problem with its fix", async () => {
    expect((await run(["add", "--kit", "vue"], ctx)).code).toBe(2);
    const missing = await run(["upgrade", "empty-folder", "--offline"], ctx);
    expect(missing.code).toBe(1);
    expect(missing.err).toContain("fix:");
    const json = await run(["remove", "core", "site", "--offline", "--json"], ctx);
    expect(json.code).toBe(1);
    expect(JSON.parse(json.out).error).toContain("core cannot be removed");
  });

  test("the store holds each version once; a download is fetched once", async () => {
    expect((await readdir(ctx.store)).sort()).toEqual(["2.0.0"]);
    expect(requests.filter((r) => r.endsWith(".tgz"))).toHaveLength(1);
  });

  test("a download that does not match its sha256 is refused; a missing version says so", async () => {
    await expect(list(ctx, { version: "3.0.0" })).rejects.toThrow(/does not match its published sha256/);
    await expect(list(ctx, { version: "4.0.0" })).rejects.toThrow(/answered 404/);
    expect(existsSync(join(ctx.store, "3.0.0"))).toBe(false);
  });

  test("a local build newer than the latest published release wins", async () => {
    await cp(join(ctx.store, "2.0.0"), join(ctx.store, "2.5.0-dev.1"), { recursive: true });
    const file = join(ctx.store, "2.5.0-dev.1", "manifest.json");
    await Bun.write(file, JSON.stringify({ ...(await Bun.file(file).json()), version: "2.5.0-dev.1" }));
    const out = await list(ctx, {});
    expect(out.lines[0]).toBe("the store has 2.5.0-dev.1, newer than the latest published release 2.0.0");
    expect(out.data.release).toMatchObject({ version: "2.5.0-dev.1" });
    await rm(join(ctx.store, "2.5.0-dev.1"), { recursive: true });
  });

  test("--from takes a .tgz too", async () => {
    const out = await list(ctx, { from: join(base, "tailor-2.0.0.tgz") });
    expect(out.data.release).toMatchObject({ version: "2.0.0" });
  });
});
