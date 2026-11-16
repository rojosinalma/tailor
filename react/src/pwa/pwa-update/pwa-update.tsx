import { info } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import type spec from "@tailor/packs/pwa/pwa-update/spec";
import { useEffect } from "react";
import { Button } from "../../core/button/button";
import { useIsStatic } from "../../kit";
import { Notice } from "../pwa/notice";
import { usePwa, useScriptHook } from "../pwa/provider";

export interface PwaUpdateProps {
  /** "silent": no notice; the update starts at the next link click or when the page is hidden. */
  mode?: (typeof spec.props.mode)[number];
}

/** A field with the focus may hold input that a reload would lose. */
const typing = (): boolean => {
  const active = document.activeElement;
  return (
    active instanceof HTMLElement && (active.isContentEditable || active.matches("input, textarea, select"))
  );
};

/** The notice "A new version is ready" with a Reload button, shown while a new version waits. */
export function PwaUpdate({ mode = "notice" }: PwaUpdateProps) {
  const pwa = usePwa();
  const hook = useScriptHook();
  const isStatic = useIsStatic();
  const { updateReady, applyUpdate } = pwa;

  useEffect(() => {
    if (mode !== "silent" || !updateReady) return;
    const apply = (): void => {
      if (!typing()) applyUpdate();
    };
    const onClick = (event: MouseEvent): void => {
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (link instanceof HTMLAnchorElement && link.origin === location.origin) apply();
    };
    const onHide = (): void => {
      if (document.visibilityState === "hidden") apply();
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [mode, updateReady, applyUpdate]);

  const dataMode = mode === "notice" ? undefined : mode;
  if (hook) return <div className="t-pwa-update" data-t="pwa-update" data-mode={dataMode} role="status" />;
  return (
    <div className="t-pwa-update" data-mode={dataMode} role="status">
      {updateReady && mode === "notice" ? (
        <Notice
          tone="info"
          glyph={info}
          action={
            <Button size="sm" onClick={isStatic ? undefined : applyUpdate}>
              {t("reload")}
            </Button>
          }
        >
          {t("newVersion")}
        </Notice>
      ) : null}
    </div>
  );
}
