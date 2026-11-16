import { offline as offlineGlyph } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import { h, once, register } from "../runtime";
import { notice, pwa } from "./boot";

register("offline-banner", (element) => {
  const store = pwa();
  let shown = false;
  const sync = (): void => {
    const { offline } = store.get();
    if (offline === shown) return;
    shown = offline;
    element.replaceChildren(
      offline
        ? notice("warning", offlineGlyph, t("offline"))
        : h("span", { class: "t-sr-only" }, t("backOnline")),
    );
  };
  sync();
  store.subscribe(sync);
});

const NOTE = "t-needs-network-note";
const DISABLED = '[data-t~="needs-network"][aria-disabled="true"]';

once("needs-network", () => {
  // Capture phase: the page's own click handlers never see a click on a disabled action.
  document.addEventListener(
    "click",
    (event) => {
      if (event.target instanceof Element && event.target.closest(DISABLED)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true,
  );
});

register("needs-network", (element) => {
  const store = pwa();
  const described = element.getAttribute("aria-describedby");
  const sync = (): void => {
    const { offline } = store.get();
    if (offline) {
      if (!document.getElementById(NOTE))
        document.body.append(h("span", { id: NOTE, hidden: true }, t("needsNetwork")));
      element.setAttribute("aria-disabled", "true");
      element.setAttribute("aria-describedby", described ? `${described} ${NOTE}` : NOTE);
    } else {
      element.removeAttribute("aria-disabled");
      if (described) element.setAttribute("aria-describedby", described);
      else element.removeAttribute("aria-describedby");
    }
  };
  sync();
  store.subscribe(sync);
});
