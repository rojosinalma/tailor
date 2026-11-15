import type { Tone } from "@tailor/core/spec";
import type { MapEngine } from "@tailor/packs/map/map/engine";
import {
  DEFAULT_CONTROLS,
  type LatLng,
  type MapControl,
  type MapMarkerData,
  type MapPathData,
  type MapTiles,
  type MapViewState,
} from "@tailor/packs/map/map/logic";
import type spec from "@tailor/packs/map/map/spec";
import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon, type IconName } from "../../core/icon/icon";
import { useIsStatic } from "../../kit";
import { AppLink } from "../../link";

export type { LatLng, MapControl, MapPathData, MapTiles, MapViewState };

export interface MapMarker {
  readonly id: string;
  readonly lat: number;
  readonly lng: number;
  /** The accessible name of the marker and the title of its card. */
  readonly label: string;
  readonly tone?: Tone;
  /** An icon in the marker; a marker with an icon is drawn as a pin, without one as a dot. */
  readonly icon?: IconName;
  /** An address: the title of the card becomes a link. */
  readonly to?: string;
  /** More content for the card. The HTML kit shows text only. */
  readonly popup?: ReactNode;
  readonly onSelect?: () => void;
}

interface MapBaseProps {
  /** The accessible name of the map region. */
  label: string;
  /** The tile source. tailor never picks one. */
  tiles: MapTiles;
  size?: (typeof spec.props.size)[number];
  /** "auto" darkens a light tile set in dark mode. */
  tileFilter?: (typeof spec.props.tileFilter)[number];
  controls?: readonly MapControl[];
  markers?: readonly MapMarker[];
  paths?: readonly MapPathData[];
  onViewChange?: (view: MapViewState) => void;
}

/** A view from a center and a zoom, or one that fits every marker and line (zoom then caps it). */
export type MapViewProps = MapBaseProps &
  ({ center: LatLng; zoom: number; fit?: false } | { fit: true; center?: undefined; zoom?: number });

const NONE: readonly never[] = [];

const markerData = ({ popup: _popup, onSelect: _onSelect, ...data }: MapMarker): MapMarkerData => data;

/** A Leaflet map in a tailor frame: tailor draws the controls, markers, lines and card in the palette. */
export function MapView(props: MapViewProps) {
  const { label, tiles, size = "md", tileFilter = "auto", controls = DEFAULT_CONTROLS } = props;
  const markers = props.markers ?? NONE;
  const paths = props.paths ?? NONE;
  const isStatic = useIsStatic();
  const root = useRef<HTMLDivElement>(null);
  const latest = useRef(props);
  const [engine, setEngine] = useState<MapEngine | null>(null);
  const [card, setCard] = useState<{ id: string; host: HTMLElement } | null>(null);

  useLayoutEffect(() => {
    latest.current = props;
  });

  const controlsKey = controls.join(" ");
  // biome-ignore lint/correctness/useExhaustiveDependencies: the map is made again only when its tiles or controls change; the rest follows below.
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let live = true;
    let made: MapEngine | null = null;
    void import("@tailor/packs/map/map/engine").then(({ createMap }) => {
      if (!live) return;
      const now = latest.current;
      made = createMap(element, {
        tiles,
        center: now.center,
        zoom: now.zoom,
        fit: now.fit === true,
        controls,
        markers: (now.markers ?? []).map(markerData),
        paths: now.paths ?? [],
        fillCard: (marker, host) => setCard(marker ? { id: marker.id, host } : null),
        onSelect: (id) => latest.current.markers?.find((m) => m.id === id)?.onSelect?.(),
        onViewChange: (view) => latest.current.onViewChange?.(view),
      });
      setEngine(made);
    });
    return () => {
      live = false;
      made?.destroy();
      setEngine(null);
      setCard(null);
    };
  }, [tiles.url, tiles.attribution, tiles.maxZoom, controlsKey]);

  useEffect(() => {
    engine?.setMarkers(markers.map(markerData));
  }, [engine, markers]);

  useEffect(() => {
    engine?.setPaths(paths);
  }, [engine, paths]);

  const [lat, lng] = props.center ?? [];
  const zoom = props.zoom;
  useEffect(() => {
    if (engine && lat !== undefined && lng !== undefined && zoom !== undefined)
      engine.setView([lat, lng], zoom);
  }, [engine, lat, lng, zoom]);

  const opened = card ? markers.find((m) => m.id === card.id) : undefined;
  useLayoutEffect(() => {
    if (opened) engine?.updateCard();
  }, [engine, opened]);

  const icons = [...new Set(markers.flatMap((m) => (m.icon ? [m.icon] : [])))];
  const attributes = {
    className: "t-map",
    role: "region",
    "aria-label": label,
    "data-size": size === "md" ? undefined : size,
    "data-tile-filter": tileFilter === "auto" ? undefined : tileFilter,
  };
  const templates = icons.map((name) => (
    <template key={name} data-icon={name}>
      <Icon name={name} />
    </template>
  ));

  if (isStatic) {
    const config = {
      tiles,
      center: props.center,
      zoom: props.zoom,
      fit: props.fit,
      controls,
      markers: markers.map((m) => ({
        ...markerData(m),
        text: typeof m.popup === "string" ? m.popup : undefined,
      })),
      paths,
    };
    return (
      <div {...attributes} data-t="map">
        {templates}
        <script
          type="application/json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON of the props, with "<" escaped so it cannot end the script.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(config).replaceAll("<", "\\u003c") }}
        />
      </div>
    );
  }

  return (
    <div {...attributes} ref={root}>
      {templates}
      {card && opened
        ? createPortal(
            <>
              {opened.to ? (
                <AppLink className="t-map-popup-title" to={opened.to}>
                  {opened.label}
                </AppLink>
              ) : (
                <p className="t-map-popup-title">{opened.label}</p>
              )}
              {opened.popup !== undefined && opened.popup !== null ? (
                <div className="t-map-popup-body">{opened.popup}</div>
              ) : null}
            </>,
            card.host,
          )
        : null}
    </div>
  );
}
