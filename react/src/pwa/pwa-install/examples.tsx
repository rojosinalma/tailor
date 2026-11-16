import { more } from "@tailor/core/glyphs.gen";
import { Button } from "../../core/button/button";
import { Menu, type MenuItem } from "../../core/menu/menu";
import { defineExamples } from "../../examples";
import { Glyph } from "../../glyph";
import { fixedPwa, PwaInstall, PwaProvider, pwaInstallMenuItem, usePwa } from "./pwa-install";

function AppMenu() {
  const install = pwaInstallMenuItem(usePwa());
  const items: MenuItem[] = [
    { id: "settings", label: "Settings" },
    { id: "help", label: "Help" },
    ...(install ? [{ type: "separator" } as const, install] : []),
  ];
  return <Menu trigger={<Button icon={<Glyph body={more} />} label="More" />} label="More" items={items} />;
}

export default defineExamples("pwa-install", [
  {
    id: "prompt",
    title: "With the install prompt",
    note: "Chromium offers its prompt: the button opens it.",
    render: () => (
      <PwaProvider store={fixedPwa({ installable: true })}>
        <PwaInstall />
      </PwaProvider>
    ),
  },
  {
    id: "steps",
    title: "With manual steps",
    note: "Safari and Firefox on Android have no prompt: the button opens the steps for that browser.",
    render: () => (
      <PwaProvider store={fixedPwa({ steps: "ios" })}>
        <PwaInstall />
      </PwaProvider>
    ),
  },
  {
    id: "menu",
    title: "As a menu item",
    render: () => (
      <PwaProvider store={fixedPwa({ installable: true })}>
        <AppMenu />
      </PwaProvider>
    ),
  },
  {
    id: "live",
    title: "This browser",
    note: "Nothing shows while the app is installed or the browser cannot install it, as on this page.",
    render: () => (
      <PwaProvider>
        <PwaInstall />
      </PwaProvider>
    ),
  },
]);
