import { afterAll, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, rm, symlink } from "node:fs/promises";
import { join } from "node:path";
import { SCRATCH, scratch } from "../test/fixture";
import { Problem } from "./errors";
import {
  applyPlan,
  diskHashes,
  Project,
  planFiles,
  recordAfter,
  sha256,
  summarize,
  type Wanted,
} from "./plan";

afterAll(() => rm(SCRATCH, { recursive: true, force: true }));

const H = { a: "a".repeat(64), b: "b".repeat(64), c: "c".repeat(64), d: "d".repeat(64) };

describe("planFiles: the upgrade plan", () => {
  const plan = (
    wanted: Record<string, string>,
    recorded: Record<string, string>,
    disk: Record<string, string | undefined>,
  ) => planFiles(new Map(Object.entries(wanted)), recorded, new Map(Object.entries(disk)));

  test("a file the release did not change and the project did not edit stays", () => {
    expect(plan({ f: H.a }, { f: H.a }, { f: H.a })).toEqual([{ kind: "same", path: "f", record: H.a }]);
  });

  test("a file the release changed and the project did not edit is written", () => {
    expect(plan({ f: H.b }, { f: H.a }, { f: H.a })).toEqual([{ kind: "change", path: "f", record: H.b }]);
  });

  test("a new file is added; a recorded file that went missing comes back", () => {
    expect(plan({ f: H.a }, {}, { f: undefined })).toEqual([{ kind: "add", path: "f", record: H.a }]);
    expect(plan({ f: H.a }, { f: H.a }, { f: undefined })).toEqual([{ kind: "add", path: "f", record: H.a }]);
  });

  test("a file the new version no longer has is removed, unless edited", () => {
    expect(plan({}, { f: H.a }, { f: H.a })).toEqual([{ kind: "remove", path: "f" }]);
    expect(plan({}, { f: H.a }, { f: H.c })).toEqual([{ kind: "kept", path: "f", writeNew: false }]);
    expect(plan({}, { f: H.a }, { f: undefined })).toEqual([{ kind: "forget", path: "f" }]);
  });

  test("an edited file is kept with its old record; the new version goes next to it", () => {
    expect(plan({ f: H.b }, { f: H.a }, { f: H.c })).toEqual([
      { kind: "kept", path: "f", writeNew: true, record: H.a },
    ]);
    // The release did not change it: nothing to put next to it.
    expect(plan({ f: H.a }, { f: H.a }, { f: H.c })).toEqual([
      { kind: "kept", path: "f", writeNew: false, record: H.a },
    ]);
    // A file that was there before tailor: kept, and recorded with the new hash so it stays "edited".
    expect(plan({ f: H.b }, {}, { f: H.c })).toEqual([
      { kind: "kept", path: "f", writeNew: true, record: H.b },
    ]);
  });

  test("an edit that matches the new version needs nothing", () => {
    expect(plan({ f: H.b }, { f: H.a }, { f: H.b })).toEqual([{ kind: "same", path: "f", record: H.b }]);
  });

  test("the record and the summary follow the steps", () => {
    const steps = plan(
      { same: H.a, change: H.b, add: H.a, edited: H.d },
      { same: H.a, change: H.a, edited: H.a, gone: H.a },
      { same: H.a, change: H.a, add: undefined, edited: H.c, gone: H.a },
    );
    expect(recordAfter(steps)).toEqual({ add: H.a, change: H.b, edited: H.a, same: H.a });
    expect(summarize(steps)).toEqual({
      added: ["add"],
      changed: ["change"],
      removed: ["gone"],
      unchanged: 1,
      kept: ["edited"],
      newFiles: ["edited.new"],
    });
  });
});

describe("Project", () => {
  test("refuses a path outside the folder, also through a link", async () => {
    const root = await scratch("project");
    const outside = await scratch("outside");
    const project = new Project(root);
    await expect(project.write("../x.txt", "x")).rejects.toThrow(Problem);
    await expect(project.write("/etc/x", "x")).rejects.toThrow(Problem);
    await expect(project.write(".", "x")).rejects.toThrow(Problem);
    await symlink(outside, join(root, "link"));
    await expect(project.write("link/x.txt", "x")).rejects.toThrow(/leads outside/);
    await project.write("a/b/c.txt", "c");
    expect(await project.hash("a/b/c.txt")).toBe(sha256("c"));
  });

  test("applies a plan and removes the folders it empties, up to the stop folder", async () => {
    const root = await scratch("apply");
    const project = new Project(root);
    await project.write("pub/tailor/old/x.css", "x");
    await mkdir(join(root, "pub/tailor/keep"), { recursive: true });
    const wanted = new Map<string, Wanted>([
      ["pub/tailor/new.css", { sha256: sha256("n"), data: async () => "n" }],
      ["pub/tailor/edited.css", { sha256: sha256("v2"), data: async () => "v2" }],
    ]);
    await project.write("pub/tailor/edited.css", "mine");
    const recorded = { "pub/tailor/old/x.css": sha256("x"), "pub/tailor/edited.css": sha256("v1") };
    const disk = await diskHashes(project, [...wanted.keys(), ...Object.keys(recorded)]);
    const steps = planFiles(new Map([...wanted].map(([p, w]) => [p, w.sha256])), recorded, disk);
    await applyPlan(project, steps, wanted, () => "pub/tailor");
    expect(await Bun.file(join(root, "pub/tailor/new.css")).text()).toBe("n");
    expect(await Bun.file(join(root, "pub/tailor/edited.css")).text()).toBe("mine");
    expect(await Bun.file(join(root, "pub/tailor/edited.css.new")).text()).toBe("v2");
    expect(await Bun.file(join(root, "pub/tailor/old/x.css")).exists()).toBe(false);
    expect(existsSync(join(root, "pub/tailor/old"))).toBe(false);
    expect(existsSync(join(root, "pub/tailor/keep"))).toBe(true);
  });
});
