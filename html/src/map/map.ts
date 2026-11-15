import { createMap } from "@tailor/packs/map/map/engine";
import { parseConfig } from "@tailor/packs/map/map/logic";
import { h, register } from "../runtime";

/** Draws a map from the JSON in its <script type="application/json">. */
register("map", (element) => {
  const source = element.querySelector(':scope > script[type="application/json"]');
  const config = parseConfig(JSON.parse(source?.textContent ?? "null"));
  const texts = new Map(config.markers.map((m) => [m.id, m.text]));
  createMap(element, {
    ...config,
    fillCard: (marker, host) => {
      if (!marker) return host.replaceChildren();
      const title = marker.to
        ? h("a", { class: "t-map-popup-title", href: marker.to }, marker.label)
        : h("p", { class: "t-map-popup-title" }, marker.label);
      const text = texts.get(marker.id);
      host.replaceChildren(title, ...(text ? [h("div", { class: "t-map-popup-body" }, text)] : []));
    },
    onSelect: (id) => element.dispatchEvent(new CustomEvent("t:select", { bubbles: true, detail: { id } })),
    onViewChange: (view) => element.dispatchEvent(new CustomEvent("t:view", { detail: view })),
  });
});
