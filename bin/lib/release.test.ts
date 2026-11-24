import { describe, expect, test } from "bun:test";
import { at } from "./paths";
import {
  ALIASES,
  importsOf,
  moduleTarget,
  packageOf,
  resolveSpecifier,
  rewriteImports,
  rewriteSpecifier,
  targetPath,
} from "./release";

describe("the React kit tree", () => {
  test("the aliases are the repository's tsconfig paths", async () => {
    const paths = (
      (await Bun.file(at("tsconfig.json")).json()) as { compilerOptions: { paths: Record<string, string[]> } }
    ).compilerOptions.paths;
    const fromConfig = Object.fromEntries(
      Object.entries(paths).map(([k, [v]]) => [
        k.replace(/\/\*$/, ""),
        (v ?? "").replace(/^\.\//, "").replace(/\/\*$/, ""),
      ]),
    );
    expect(fromConfig).toEqual({ ...ALIASES });
  });

  test("files go to their place in the release; examples and *.gen names do not stay", () => {
    expect(targetPath("react/src/kit.tsx")).toBe("react/kit/kit.tsx");
    expect(targetPath("react/src/examples.ts")).toBeUndefined();
    expect(targetPath("react/src/core/button/button.tsx")).toBe("react/core/button/button.tsx");
    expect(targetPath("react/src/core/button/examples.tsx")).toBeUndefined();
    expect(targetPath("react/src/charts/chart-base.tsx")).toBe("react/charts/chart-base.tsx");
    expect(targetPath("react/src/forms/index.gen.ts")).toBe("react/forms/index.ts");
    expect(targetPath("core/src/glyphs.gen.ts")).toBe("react/lib/core/glyphs.ts");
    expect(targetPath("core/src/theme.ts")).toBe("react/lib/core/theme.ts");
    expect(targetPath("core/packs/pickers/date/logic.ts")).toBe("react/lib/packs/pickers/date/logic.ts");
    expect(targetPath("react/src/layouts/settings/settings.tsx")).toBe("react/layouts/settings/settings.tsx");
    expect(moduleTarget("html/src/core/dialog")).toBeUndefined();
    expect(moduleTarget("showcase/src/entry")).toBeUndefined();
  });

  test("aliases and relative imports resolve to repository modules; libraries do not", () => {
    expect(resolveSpecifier("react/src/core/button/button.tsx", "@tailor/core/spec")).toBe("core/src/spec");
    expect(resolveSpecifier("react/src/core/button/button.tsx", "../../kit")).toBe("react/src/kit");
    expect(resolveSpecifier("core/packs/x/y/logic.ts", "./parts.ts")).toBe("core/packs/x/y/parts");
    expect(resolveSpecifier("react/src/a/b/b.tsx", "@base-ui/react/dialog")).toBeUndefined();
    expect(resolveSpecifier("react/src/a/b/b.tsx", "react")).toBeUndefined();
  });

  test("the rewriter gives the relative specifier from the new place", () => {
    const button = ["react/src/core/button/button.tsx", "react/core/button/button.tsx"] as const;
    expect(rewriteSpecifier(...button, "@tailor/core/glyphs.gen")).toBe("../../lib/core/glyphs");
    expect(rewriteSpecifier(...button, "@tailor/packs/core/button/spec")).toBe(
      "../../lib/packs/core/button/spec",
    );
    expect(rewriteSpecifier(...button, "../../kit")).toBe("../../kit/kit");
    expect(rewriteSpecifier(...button, "../stack/stack")).toBe("../stack/stack");
    expect(rewriteSpecifier(...button, "./parts")).toBe("./parts");
    expect(rewriteSpecifier(...button, "@base-ui/react/button")).toBe("@base-ui/react/button");
    const index = ["react/src/charts/index.gen.ts", "react/charts/index.ts"] as const;
    expect(rewriteSpecifier(...index, "./line-chart/line-chart")).toBe("./line-chart/line-chart");
    const kit = ["react/src/glyph.tsx", "react/kit/glyph.tsx"] as const;
    expect(rewriteSpecifier(...kit, "./kit")).toBe("./kit");
    expect(rewriteSpecifier(...kit, "@tailor/core/glyphs.gen")).toBe("../lib/core/glyphs");
    const logic = ["core/packs/charts/chart/dom.ts", "react/lib/packs/charts/chart/dom.ts"] as const;
    expect(rewriteSpecifier(...logic, "@tailor/core/theme")).toBe("../../../core/theme");
    expect(rewriteSpecifier(...logic, "./logic")).toBe("./logic");
    const core = ["core/src/text.ts", "react/lib/core/text.ts"] as const;
    expect(rewriteSpecifier(...core, "./texts.gen")).toBe("./texts");
    expect(rewriteSpecifier(...core, "../packs/core/x/spec")).toBe("../packs/core/x/spec");
    expect(() => rewriteSpecifier(...button, "./examples")).toThrow(/does not carry/);
    expect(() => rewriteSpecifier(...button, "@tailor/html/runtime")).toThrow(/does not carry/);
  });

  test("rewrites every kind of import, and only imports", () => {
    const source = [
      'import type spec from "@tailor/packs/core/button/spec";',
      "import {",
      "  a,",
      "  type B,",
      '} from "../../kit";',
      'export * from "./button";',
      'import "@tailor/core/theme";',
      'const engine = () => import("@tailor/packs/map/map/engine");',
      '/** From "#rgb" or "rgb". */',
      'const label = "from \\"x\\"";',
    ].join("\n");
    const out = rewriteImports(source, "react/src/core/button/button.tsx", "react/core/button/button.tsx");
    expect(out).toContain('import type spec from "../../lib/packs/core/button/spec";');
    expect(out).toContain('} from "../../kit/kit";');
    expect(out).toContain('export * from "./button";');
    expect(out).toContain('import "../../lib/core/theme";');
    expect(out).toContain('import("../../lib/packs/map/map/engine")');
    expect(out).toContain('/** From "#rgb" or "rgb". */');
    expect(importsOf(source)).toEqual([
      "@tailor/packs/core/button/spec",
      "../../kit",
      "./button",
      "@tailor/core/theme",
      "@tailor/packs/map/map/engine",
    ]);
  });

  test("a library import names its package", () => {
    expect(packageOf("highlight.js/lib/core")).toBe("highlight.js");
    expect(packageOf("@base-ui/react/dialog")).toBe("@base-ui/react");
    expect(packageOf("react")).toBe("react");
  });
});

describe("generated files", () => {
  // A fresh checkout (CI) has no core/src/*.gen.ts until gen() runs; the build tools must not import one
  // at import time, or bin/build and bin/check fail before they can write it (2.3.0 failed in CI so).
  test("the build tools import no generated file at import time", async () => {
    const offenders: string[] = [];
    for (const pattern of ["bin/*", "bin/lib/*.ts", "checks/src/*.ts"]) {
      for await (const file of new Bun.Glob(pattern).scan({ cwd: at("."), onlyFiles: true })) {
        if (file.endsWith(".test.ts") || file === "bin/lib/gen.ts") continue;
        const source = await Bun.file(at(file)).text();
        if (/^import[^;]*from\s+["'][^"']*\.gen["']/m.test(source)) offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });
});
