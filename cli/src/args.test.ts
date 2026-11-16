import { describe, expect, test } from "bun:test";
import { choice, helpText, list, parseArgs } from "./args";
import { UsageError } from "./errors";
import { compareVersions, isBetween, isPrerelease, isVersion } from "./version";

describe("parseArgs", () => {
  test("no arguments and --help give the help, --version the version", () => {
    expect(parseArgs([]).command).toBe("help");
    expect(parseArgs(["--help"]).command).toBe("help");
    expect(parseArgs(["--version"]).command).toBe("version");
  });

  test("reads positionals, flags and values in both forms", () => {
    const p = parseArgs(["add", "app", "--kit", "react", "--packs=forms,charts", "--json"]);
    expect(p.command).toBe("add");
    expect(p.positionals).toEqual(["app"]);
    expect(p.options).toEqual({ kit: "react", packs: "forms,charts", json: true });
    expect(list(p.options, "packs")).toEqual(["forms", "charts"]);
  });

  test("--version after a command is the release version of add", () => {
    expect(parseArgs(["add", "--version", "2.1.0"]).options.version).toBe("2.1.0");
  });

  test("refuses what it does not know", () => {
    expect(() => parseArgs(["build"])).toThrow(UsageError);
    expect(() => parseArgs(["add", "--colour"])).toThrow(/Unknown option --colour/);
    expect(() => parseArgs(["add", "--kit"])).toThrow(/needs a value/);
    expect(() => parseArgs(["add", "--kit", "--json"])).toThrow(/needs a value/);
    expect(() => parseArgs(["upgrade", "--yes=1"])).toThrow(/takes no value/);
    expect(() => parseArgs(["add", "a", "b"])).toThrow(/Too many arguments/);
    expect(() => parseArgs(["remove"])).toThrow(/Missing an argument/);
    expect(() => parseArgs(["add", "--kit", "html", "--kit", "react"])).toThrow(/twice/);
  });

  test("an option with allowed values checks them", () => {
    expect(choice({ kit: "html" }, "kit", ["react", "html"])).toBe("html");
    expect(choice({}, "kit", ["react", "html"])).toBeUndefined();
    expect(() => choice({ kit: "vue" }, "kit", ["react", "html"])).toThrow(/must be one of: react, html/);
  });

  test("help names every command and the options of one", () => {
    expect(helpText()).toContain("upgrade");
    expect(helpText("add")).toContain("--kit react|html");
    expect(() => helpText("nope")).toThrow(UsageError);
  });
});

describe("versions", () => {
  test("compare by number, a pre-release before its release", () => {
    expect(compareVersions("2.0.0", "2.0.0")).toBe(0);
    expect(compareVersions("2.0.10", "2.0.9")).toBeGreaterThan(0);
    expect(compareVersions("2.0.0-dev.0", "2.0.0")).toBeLessThan(0);
    expect(compareVersions("2.0.0-dev.10", "2.0.0-dev.9")).toBeGreaterThan(0);
    expect(compareVersions("2.0.0-dev.1", "2.0.0-dev")).toBeGreaterThan(0);
    expect(compareVersions("2.0.0-alpha", "2.0.0-beta")).toBeLessThan(0);
    expect(compareVersions("2.0.0-1", "2.0.0-alpha")).toBeLessThan(0);
    expect(compareVersions("1.9.9", "2.0.0")).toBeLessThan(0);
    expect(() => compareVersions("2.0", "2.0.0")).toThrow(/Not a version: 2.0/);
  });

  test("the order of the semver specification, build metadata left out", () => {
    const order = [
      "1.0.0-alpha",
      "1.0.0-alpha.1",
      "1.0.0-alpha.beta",
      "1.0.0-beta",
      "1.0.0-beta.2",
      "1.0.0-beta.11",
      "1.0.0-rc.1",
      "1.0.0",
      "1.0.1",
      "1.1.0",
      "2.0.0",
    ];
    const shuffled = [...order].reverse();
    expect(shuffled.sort(compareVersions)).toEqual(order);
    expect(compareVersions("1.0.0+build.5", "1.0.0")).toBe(0);
    expect(compareVersions("1.0.0-rc.1+build.5", "1.0.0")).toBeLessThan(0);
    expect(isVersion("01.0.0")).toBe(false);
    expect(isVersion("1.0.0-")).toBe(false);
  });

  test("a pre-release has a tag; build metadata is no tag", () => {
    expect(isPrerelease("2.0.0-rc.1")).toBe(true);
    expect(isPrerelease("2.0.0-dev.0")).toBe(true);
    expect(isPrerelease("2.0.0")).toBe(false);
    expect(isPrerelease("2.0.0+build.5")).toBe(false);
  });

  test("isBetween takes the range (from, to]", () => {
    expect(isBetween("2.0.0", "1.0.0", "2.0.0")).toBe(true);
    expect(isBetween("1.0.0", "1.0.0", "2.0.0")).toBe(false);
    expect(isBetween("3.0.0", "1.0.0", "2.0.0")).toBe(false);
  });
});
