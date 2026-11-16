import { install as installGlyph } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import { canInstall } from "@tailor/packs/pwa/pwa/logic";
import { Button } from "../../core/button/button";
import type { MenuActionItem } from "../../core/menu/menu";
import { Glyph } from "../../glyph";
import { useIsStatic } from "../../kit";
import { InstallStepsDialog, type Pwa, usePwa, useScriptHook } from "../pwa/provider";

export { createPwa, fixedPwa, type PwaOptions, type PwaStore } from "@tailor/packs/pwa/pwa/client";
export type { InstallSteps, PwaState } from "@tailor/packs/pwa/pwa/logic";
export { type Pwa, PwaProvider, type PwaProviderProps, usePwa } from "../pwa/provider";

/**
 * The "Install app" button. It draws nothing when the app is installed or the browser cannot install it.
 * For a menu, use pwaInstallMenuItem(usePwa()) instead.
 */
export function PwaInstall() {
  const pwa = usePwa();
  const isStatic = useIsStatic();
  const hook = useScriptHook();
  const icon = <Glyph body={installGlyph} />;
  if (hook)
    return (
      <Button className="t-pwa-install" icon={icon} data-t="pwa-install" hidden>
        {t("installApp")}
      </Button>
    );
  if (!canInstall(pwa)) return null;
  const button = (
    <Button className="t-pwa-install" icon={icon} onClick={isStatic ? undefined : pwa.install}>
      {t("installApp")}
    </Button>
  );
  // The static page of an example: the dialog of the HTML kit, opened by the button.
  if (isStatic && pwa.steps && !pwa.installable)
    return <InstallStepsDialog steps={pwa.steps} trigger={button} />;
  return button;
}

/** The "Install app" item for a menu, or null when it must not show. */
export function pwaInstallMenuItem(pwa: Pwa): MenuActionItem | null {
  if (!canInstall(pwa)) return null;
  return {
    id: "install-app",
    label: t("installApp"),
    icon: <Glyph body={installGlyph} />,
    onSelect: pwa.install,
  };
}
