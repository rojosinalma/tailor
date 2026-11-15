/** The map data that both kits share, and the check of the HTML kit's JSON. Plain TypeScript, no DOM. */
import { TONES, type Tone } from "@tailor/core/spec";
import type spec from "./spec";

export type LatLng = readonly [lat: number, lng: number];
export type MapControl = (typeof spec.props.controls)[number];

export interface MapTiles {
  /** The tile address template, for example "https://tiles.example.com/{z}/{x}/{y}.png". */
  readonly url: string;
  /** The credit that the tile provider asks for. HTML, shown in a corner and never hidden. */
  readonly attribution: string;
  readonly maxZoom?: number;
}

export interface MapMarkerData {
  readonly id: string;
  readonly lat: number;
  readonly lng: number;
  /** The accessible name of the marker and the title of its card. */
  readonly label: string;
  readonly tone?: Tone;
  /** An icon from the sprite, for example "bi:hdd". A marker with an icon is drawn as a pin. */
  readonly icon?: string;
  /** An address: the title of the card becomes a link. */
  readonly to?: string;
}

export interface MapPathData {
  readonly id: string;
  readonly points: readonly LatLng[];
  readonly tone?: Tone;
}

export interface MapViewState {
  readonly center: LatLng;
  readonly zoom: number;
}

/** What the HTML kit reads from the map's JSON. A marker can carry a line of text for its card. */
export interface MapConfig {
  readonly tiles: MapTiles;
  readonly center?: LatLng;
  readonly zoom?: number;
  readonly fit: boolean;
  readonly controls: readonly MapControl[];
  readonly markers: readonly (MapMarkerData & { readonly text?: string })[];
  readonly paths: readonly MapPathData[];
}

export const DEFAULT_CONTROLS: readonly MapControl[] = ["zoom"];
const CONTROLS: readonly string[] = ["zoom", "fit", "locate"];

type Data = Record<string, unknown>;

const isData = (value: unknown): value is Data =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function fail(message: string): never {
  throw new Error(`map: ${message}`);
}

function text(data: Data, key: string, where: string, required: true): string;
function text(data: Data, key: string, where: string, required?: false): string | undefined;
function text(data: Data, key: string, where: string, required = false): string | undefined {
  const value = data[key];
  if (value === undefined && !required) return undefined;
  if (typeof value !== "string" || value === "") fail(`${where}.${key} must be a text`);
  return value;
}

function num(data: Data, key: string, where: string, required: true): number;
function num(data: Data, key: string, where: string, required?: false): number | undefined;
function num(data: Data, key: string, where: string, required = false): number | undefined {
  const value = data[key];
  if (value === undefined && !required) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value)) fail(`${where}.${key} must be a number`);
  return value;
}

function latLng(value: unknown, where: string): LatLng {
  if (!Array.isArray(value) || value.length !== 2) fail(`${where} must be [lat, lng]`);
  const [lat, lng] = value as unknown[];
  if (typeof lat !== "number" || typeof lng !== "number" || Math.abs(lat) > 90 || Math.abs(lng) > 180)
    fail(`${where} must be [lat, lng] in degrees`);
  return [lat, lng];
}

function tone(data: Data, where: string): Tone | undefined {
  const value = data.tone;
  if (value === undefined) return undefined;
  if (!TONES.includes(value as Tone)) fail(`${where}.tone must be one of ${TONES.join(", ")}`);
  return value as Tone;
}

function list(data: Data, key: string): unknown[] {
  const value = data[key] ?? [];
  if (!Array.isArray(value)) fail(`${key} must be a list`);
  return value;
}

function unique<T extends { id: string }>(items: T[], key: string): T[] {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) fail(`${key}: the id "${item.id}" is used twice`);
    seen.add(item.id);
  }
  return items;
}

/** Checks the JSON of an HTML kit map and fills in the defaults. Throws on the first wrong value. */
export function parseConfig(value: unknown): MapConfig {
  if (!isData(value)) fail("the configuration must be an object");
  const tiles = value.tiles;
  if (!isData(tiles)) fail("tiles must be { url, attribution }");
  const fit = value.fit === true;
  const center = value.center === undefined ? undefined : latLng(value.center, "center");
  const zoom = num(value, "zoom", "map");
  if (!fit && (center === undefined || zoom === undefined)) fail("give center and zoom, or fit: true");

  const controls = value.controls === undefined ? DEFAULT_CONTROLS : list(value, "controls");
  for (const c of controls) if (!CONTROLS.includes(c as string)) fail(`unknown control "${String(c)}"`);

  const markers = list(value, "markers").map((m, i) => {
    const where = `markers[${i}]`;
    if (!isData(m)) fail(`${where} must be an object`);
    const [lat, lng] = latLng([num(m, "lat", where, true), num(m, "lng", where, true)], where);
    return {
      id: text(m, "id", where, true),
      lat,
      lng,
      label: text(m, "label", where, true),
      tone: tone(m, where),
      icon: text(m, "icon", where),
      to: text(m, "to", where),
      text: text(m, "text", where),
    };
  });

  const paths = list(value, "paths").map((p, i) => {
    const where = `paths[${i}]`;
    if (!isData(p)) fail(`${where} must be an object`);
    const points = list(p, "points").map((point, j) => latLng(point, `${where}.points[${j}]`));
    if (points.length < 2) fail(`${where} needs two points or more`);
    return { id: text(p, "id", where, true), points, tone: tone(p, where) };
  });

  return {
    tiles: {
      url: text(tiles, "url", "tiles", true),
      attribution: text(tiles, "attribution", "tiles", true),
      maxZoom: num(tiles, "maxZoom", "tiles"),
    },
    center,
    zoom,
    fit,
    controls: controls as MapControl[],
    markers: unique(markers, "markers"),
    paths: unique(paths, "paths"),
  };
}
