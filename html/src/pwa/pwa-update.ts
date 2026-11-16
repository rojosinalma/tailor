import { info } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import { h, register } from "../runtime";
import { notice, pwa } from "./boot";

/** A field with the focus may hold input that a reload would lose. */
const typing = (): boolean => {
  const active = document.activeElement;
  return (
    active instanceof HTMLElement && (active.isContentEditable || active.matches("input, textarea, select"))
  );
};

register("pwa-update", (element) => {
  const store = pwa();
  const silent = element.dataset.mode === "silent";
  const apply = (): void => {
    if (store.get().updateReady && !typing()) store.applyUpdate();
  };
  if (silent) {
    document.addEventListener(
      "click",
      (event) => {
        const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
        if (link instanceof HTMLAnchorElement && link.origin === location.origin) apply();
      },
      true,
    );
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") apply();
    });
    return;
  }
  let shown = false;
  const sync = (): void => {
    const { updateReady } = store.get();
    if (updateReady === shown) return;
    shown = updateReady;
    if (!updateReady) {
      element.replaceChildren();
      return;
    }
    const reload = h("button", { type: "button", class: "t-btn", "data-size": "sm" }, t("reload"));
    reload.addEventListener("click", () => store.applyUpdate());
    element.replaceChildren(notice("info", info, t("newVersion"), reload));
  };
  sync();
  store.subscribe(sync);
});
