import { defineComponent, TONES } from "@tailor/core/spec";

export default defineComponent({
  id: "map",
  name: "Map",
  pack: "map",
  group: "display",
  description:
    "A map from a tile source the app gives, with markers, lines and controls drawn in the palette. Leaflet draws the map.",
  root: "t-map",
  parts: {
    "t-map-controls": "the stack of zoom, fit and locate buttons at the top end corner",
    "t-map-marker": "one marker: a dot, or a pin when it has an icon; a button named by its label",
    "t-map-marker-shape": "the drawn dot or pin inside a marker",
    "t-map-popup": "the card that a selected marker opens",
    "t-map-popup-title": "the marker label in the card, a link when the marker has an address",
    "t-map-popup-body": "the extra content of the card",
    "t-map-path": "a line through points",
    "t-map-here": "the position that the locate button found",
  },
  props: {
    size: ["sm", "md", "lg", "fill"],
    tileFilter: ["none", "auto"],
    controls: ["zoom", "fit", "locate"],
    tone: TONES,
    label: [],
  },
  html: "script",
});
