/**
 * The pages of the sample apps that the page checks open (showcase/src/demo/routes.ts), and on which screens.
 * A full run takes every page in every skin on every screen. A release stays in its time limit: the sample
 * pages in every skin on a phone and a desktop, and in the default skin on the tablets and the two app screens
 * (a large desktop and a short window); the stress pages in the default skin on the release screens.
 */
import type { ComponentSpec } from "../../core/src/spec";
import { APP_PAGES, htmlAddress, reactAddress } from "../../showcase/src/demo/routes";
import type { AppCheck } from "./pages";

const BASE = ["390", "820", "1180", "1440"];
const APP_SCREENS = ["2560", "1440x800"];

export function appChecks(specs: readonly ComponentSpec[], mode: "release" | "full"): AppCheck[] {
  return APP_PAGES.map((page) => {
    const spec = specs.find((s) => s.id === page.shell);
    const check = (screens: readonly string[], defaultSkinOnly: readonly string[] = []): AppCheck => ({
      shell: page.shell,
      id: page.id,
      html: spec !== undefined && spec.html !== "none",
      screens,
      defaultSkinOnly,
      react: reactAddress(page),
      htmlUrl: htmlAddress(page),
    });
    if (mode === "full") return check([...BASE, "1920", ...APP_SCREENS]);
    if (page.stress) return check(BASE, BASE);
    return check([...BASE, ...APP_SCREENS], ["820", "1180", ...APP_SCREENS]);
  });
}
