/**
 * The map engine that both kits drive: a Leaflet map inside the tailor frame, with tailor's controls,
 * markers, lines and card. It needs a browser: the React kit loads it in an effect, the HTML kit bundles it.
 */
import { close, dash, mapFit, mapLocate, plus } from "@tailor/core/glyphs.gen";
import { type TextKey, t } from "@tailor/core/text";
import * as L from "leaflet";
import type { LatLng, MapControl, MapMarkerData, MapPathData, MapTiles, MapViewState } from "./logic";

export interface MapEngineOptions {
  readonly tiles: MapTiles;
  readonly center?: LatLng;
  /** The start zoom; with fit, the most that fitting zooms in. */
  readonly zoom?: number;
  readonly fit: boolean;
  readonly controls: readonly MapControl[];
  readonly markers: readonly MapMarkerData[];
  readonly paths: readonly MapPathData[];
  /** Fills the card of the opened marker into `host`; called with null when the card closes. */
  readonly fillCard: (marker: MapMarkerData | null, host: HTMLElement) => void;
  readonly onSelect?: (id: string) => void;
  readonly onViewChange?: (view: MapViewState) => void;
}

export interface MapEngine {
  setMarkers(markers: readonly MapMarkerData[]): void;
  setPaths(paths: readonly MapPathData[]): void;
  setView(center: LatLng, zoom: number): void;
  /** Places the card again after its content changed. */
  updateCard(): void;
  destroy(): void;
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes: Record<string, string>,
  ...children: Node[]
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  element.append(...children);
  return element;
}

function glyph(body: string): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "t-icon");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = body;
  return svg;
}

function setData(element: Element, name: string, value: string | undefined): void {
  if (value === undefined) element.removeAttribute(name);
  else element.setAttribute(name, value);
}

/** The sprite icon of a marker comes from a <template data-icon="…"> that the kit puts in the map. */
function markerGlyph(root: HTMLElement, name: string): Node {
  const template = root.querySelector<HTMLTemplateElement>(`template[data-icon="${CSS.escape(name)}"]`);
  const source = template?.content.firstElementChild ?? template?.firstElementChild;
  if (!source) throw new Error(`map: no <template data-icon="${name}"> for the marker icon`);
  return source.cloneNode(true);
}

export function createMap(root: HTMLElement, options: MapEngineOptions): MapEngine {
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const end = getComputedStyle(root).direction === "rtl" ? "left" : "right";
  const events = new AbortController();
  const signal = events.signal;

  const map = L.map(root, {
    zoomControl: false,
    attributionControl: false,
    fadeAnimation: !still,
    zoomAnimation: !still,
    markerZoomAnimation: !still,
  });
  L.tileLayer(options.tiles.url, {
    attribution: options.tiles.attribution,
    maxZoom: options.tiles.maxZoom ?? 18,
  }).addTo(map);
  L.control.attribution({ prefix: false, position: `bottom${end}` }).addTo(map);

  const markerLayer = L.featureGroup().addTo(map);
  const pathLayer = L.featureGroup().addTo(map);
  const markers = new Map<string, { marker: L.Marker; data: MapMarkerData }>();
  const paths = new Map<string, L.Polyline>();

  // Controls.
  const box = el("div", { class: "t-map-controls" });
  const control = new L.Control({ position: `top${end}` });
  control.onAdd = () => box;
  const addButton = (key: TextKey, body: string, action: () => void): HTMLButtonElement => {
    const button = el(
      "button",
      { type: "button", class: "t-btn", "data-size": "sm", "data-icon-only": "", "aria-label": t(key) },
      glyph(body),
    );
    button.addEventListener("click", () => {
      if (button.getAttribute("aria-disabled") !== "true") action();
    });
    box.append(button);
    return button;
  };
  const zoomIn = options.controls.includes("zoom") ? addButton("mapZoomIn", plus, () => map.zoomIn()) : null;
  const zoomOut = options.controls.includes("zoom")
    ? addButton("mapZoomOut", dash, () => map.zoomOut())
    : null;
  if (options.controls.includes("fit")) addButton("mapFit", mapFit, () => fit());
  if (options.controls.includes("locate") && "geolocation" in navigator)
    addButton("mapLocate", mapLocate, () => map.locate({ setView: true, maxZoom: map.getMaxZoom() }));
  control.addTo(map);
  L.DomEvent.disableClickPropagation(box);
  L.DomEvent.disableScrollPropagation(box);

  const syncZoom = (): void => {
    setData(zoomIn ?? box, "aria-disabled", map.getZoom() >= map.getMaxZoom() ? "true" : undefined);
    setData(zoomOut ?? box, "aria-disabled", map.getZoom() <= map.getMinZoom() ? "true" : undefined);
  };
  map.on("zoomend", syncZoom);

  let here: L.Marker | null = null;
  map.on("locationfound", (event: L.LocationEvent) => {
    here ??= L.marker(event.latlng, {
      icon: L.divIcon({ className: "t-map-here", html: "", iconSize: undefined }),
      interactive: false,
      keyboard: false,
    }).addTo(map);
    here.setLatLng(event.latlng);
    here.getElement()?.setAttribute("aria-hidden", "true");
  });

  // The card of a selected marker.
  const host = el("div", { class: "t-map-popup-content" });
  const shut = el(
    "button",
    {
      type: "button",
      class: "t-btn t-map-popup-close",
      "data-variant": "ghost",
      "data-size": "sm",
      "data-icon-only": "",
      "aria-label": t("close"),
    },
    glyph(close),
  );
  const card = el("div", { class: "t-map-popup", role: "dialog", tabindex: "-1" }, host, shut);
  const popup = L.popup({ closeButton: false, offset: [0, 0], minWidth: 0 });
  popup.setContent(card);
  markerLayer.bindPopup(popup);
  let opened: { marker: L.Marker; data: MapMarkerData } | null = null;

  // Leaflet puts the content in again on an update, which drops the focus: give it back.
  const relayout = (): void => {
    const active = document.activeElement;
    popup.update();
    if (active instanceof HTMLElement && card.contains(active)) active.focus({ preventScroll: true });
  };
  const closeCard = (): void => {
    const marker = opened?.marker.getElement();
    map.closePopup(popup);
    marker?.focus({ preventScroll: true });
  };
  shut.addEventListener("click", closeCard);

  const onOpen = (entry: { marker: L.Marker; data: MapMarkerData }): void => {
    opened = entry;
    card.setAttribute("aria-label", entry.data.label);
    entry.marker.getElement()?.setAttribute("aria-expanded", "true");
    const element = popup.getElement();
    if (element) setData(element, "data-shape", entry.data.icon ? "pin" : undefined);
    // The card stays inside the map, with the corner margin of the controls around it.
    const margin = box.offsetTop;
    popup.options.maxWidth = Math.max(root.clientWidth - 2 * margin, 0);
    popup.options.autoPanPadding = [margin, margin];
    options.fillCard(entry.data, host);
    relayout();
    card.focus({ preventScroll: true });
    options.onSelect?.(entry.data.id);
  };
  const onClose = (): void => {
    opened?.marker.getElement()?.setAttribute("aria-expanded", "false");
    opened = null;
    options.fillCard(null, host);
  };
  root.addEventListener(
    "keydown",
    (event) => {
      if (event.key !== "Escape" || !opened) return;
      event.stopPropagation();
      closeCard();
    },
    { signal },
  );

  // Markers.
  const decorate = (marker: L.Marker, data: MapMarkerData): void => {
    const element = marker.getElement();
    if (!element) return;
    element.setAttribute("aria-label", data.label);
    element.setAttribute("aria-expanded", String(opened?.marker === marker));
    setData(element, "data-tone", data.tone);
    setData(element, "data-shape", data.icon ? "pin" : undefined);
  };
  const markerIcon = (data: MapMarkerData): L.DivIcon => {
    const shape = el("span", { class: "t-map-marker-shape" });
    if (data.icon) shape.append(markerGlyph(root, data.icon));
    return L.divIcon({ className: "t-map-marker", html: shape, iconSize: undefined });
  };
  const setMarkers = (list: readonly MapMarkerData[]): void => {
    const ids = new Set(list.map((m) => m.id));
    for (const [id, { marker }] of markers) {
      if (ids.has(id)) continue;
      markerLayer.removeLayer(marker);
      markers.delete(id);
    }
    for (const data of list) {
      const entry = markers.get(data.id);
      if (!entry) {
        const marker = L.marker([data.lat, data.lng], { icon: markerIcon(data) }).addTo(markerLayer);
        // A button answers Space as well as Enter.
        marker.getElement()?.addEventListener("keydown", (event) => {
          if (event.key !== " ") return;
          event.preventDefault();
          if (opened?.marker === marker) closeCard();
          else marker.fire("click", { latlng: marker.getLatLng() });
        });
        const created = { marker, data };
        marker.on("popupopen", () => onOpen(created));
        marker.on("popupclose", onClose);
        markers.set(data.id, created);
        decorate(marker, data);
        continue;
      }
      if (entry.data.lat !== data.lat || entry.data.lng !== data.lng)
        entry.marker.setLatLng([data.lat, data.lng]);
      if (entry.data.icon !== data.icon) entry.marker.setIcon(markerIcon(data));
      entry.data = data;
      decorate(entry.marker, data);
      if (opened === entry) options.fillCard(data, host);
    }
  };

  // Lines: the stroke comes from the tone tokens in the stylesheet, so a theme change recolours them.
  const setPaths = (list: readonly MapPathData[]): void => {
    const ids = new Set(list.map((p) => p.id));
    for (const [id, line] of paths) {
      if (ids.has(id)) continue;
      pathLayer.removeLayer(line);
      paths.delete(id);
    }
    for (const data of list) {
      let line = paths.get(data.id);
      const points = data.points.map(([lat, lng]) => L.latLng(lat, lng));
      if (line) line.setLatLngs(points);
      else {
        line = L.polyline(points, { className: "t-map-path", interactive: false }).addTo(pathLayer);
        paths.set(data.id, line);
      }
      const element = line.getElement();
      if (element) setData(element, "data-tone", data.tone);
    }
  };

  const fit = (): void => {
    const bounds = L.latLngBounds([]);
    for (const { marker } of markers.values()) bounds.extend(marker.getLatLng());
    for (const line of paths.values()) bounds.extend(line.getBounds());
    if (!bounds.isValid()) return;
    // Room for the controls and for a pin that stands above its point.
    const pad = box.offsetTop * 2 + box.offsetWidth;
    map.fitBounds(bounds, {
      padding: [pad, pad],
      maxZoom: options.zoom ?? map.getMaxZoom(),
      animate: !still,
    });
  };

  // Leaflet draws layers only once the map has a view, and the markers need their elements now.
  map.setView(L.latLng(options.center?.[0] ?? 0, options.center?.[1] ?? 0), options.zoom ?? map.getMinZoom());
  setMarkers(options.markers);
  setPaths(options.paths);
  if (options.fit) fit();
  syncZoom();
  map.on("moveend", () => {
    const center = map.getCenter();
    options.onViewChange?.({ center: [center.lat, center.lng], zoom: map.getZoom() });
  });

  // The wheel zooms only while the map has the focus, or with Ctrl held: a page scroll never gets caught.
  root.addEventListener(
    "wheel",
    (event) => {
      if (!event.ctrlKey && !root.contains(document.activeElement)) event.stopImmediatePropagation();
    },
    { capture: true, signal },
  );
  const resize = new ResizeObserver(() => map.invalidateSize());
  resize.observe(root);

  return {
    setMarkers,
    setPaths,
    setView(center, zoom) {
      const now = map.getCenter();
      if (now.lat === center[0] && now.lng === center[1] && map.getZoom() === zoom) return;
      map.setView(L.latLng(center[0], center[1]), zoom, { animate: !still });
    },
    updateCard() {
      if (opened) relayout();
    },
    destroy() {
      events.abort();
      resize.disconnect();
      map.remove();
    },
  };
}
