/**
 * Under reduced motion the map moves without animation, so Leaflet needs no 3D layers. Without them the browser
 * paints the map, its markers and its controls in one layer, the same way on every frame. Leaflet reads this flag
 * once, when it loads: the engine imports this file before Leaflet.
 */
const host = globalThis as { L_DISABLE_3D?: boolean };
if (matchMedia("(prefers-reduced-motion: reduce)").matches) host.L_DISABLE_3D = true;
