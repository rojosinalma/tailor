import { defineExamples } from "../../examples";
import { type MapMarker, type MapTiles, MapView } from "./map";

// Sample tiles: one light grid square, repeated, so the examples draw without a tile server.
const tile =
  '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">' +
  '<rect width="256" height="256" fill="#eef1f3"/>' +
  '<path d="M0 64.5H256M0 128.5H256M0 192.5H256M64.5 0V256M128.5 0V256M192.5 0V256" stroke="#d5dbe0"/>' +
  '<path d="M0 .5H256M.5 0V256" stroke="#b9c2ca"/></svg>';

const TILES: MapTiles = {
  url: `data:image/svg+xml,${encodeURIComponent(tile)}`,
  attribution: 'Sample tiles from <a href="https://example.com/tiles">example.com</a>',
  maxZoom: 8,
};

const HOSTS: readonly MapMarker[] = [
  {
    id: "web-1",
    lat: 48.8584,
    lng: 2.2945,
    label: "web-1",
    tone: "success",
    icon: "bi:hdd-network",
    to: "#web-1",
    popup: "Serves example.com. Up for 41 days.",
  },
  {
    id: "nas",
    lat: 52.5163,
    lng: 13.3777,
    label: "nas",
    tone: "warning",
    icon: "bi:hdd-stack",
    popup: "The disk is 86% full.",
  },
  { id: "db-1", lat: 41.8902, lng: 12.4922, label: "db-1", tone: "danger", popup: "Not reachable." },
];

export default defineExamples("map", [
  {
    id: "default",
    title: "Hosts in three places",
    note: "The view fits every marker. A marker with an icon is a pin; select one to open its card.",
    render: () => (
      <MapView label="Host locations" tiles={TILES} fit markers={HOSTS} controls={["zoom", "fit"]} />
    ),
  },
  {
    id: "path",
    title: "A line between places",
    render: () => (
      <MapView
        label="Route from web-1 to nas"
        tiles={TILES}
        center={[50.7, 8]}
        zoom={4}
        controls={["zoom", "fit", "locate"]}
        markers={HOSTS.slice(0, 2).map(({ icon: _icon, ...host }) => host)}
        paths={[
          {
            id: "link",
            tone: "info",
            points: [
              [48.8584, 2.2945],
              [50.1, 8.7],
              [52.5163, 13.3777],
            ],
          },
        ]}
      />
    ),
  },
  {
    id: "small",
    title: "Small, in a narrow box, tiles as they are",
    width: "sm",
    render: () => (
      <MapView
        label="Office"
        tiles={TILES}
        size="sm"
        tileFilter="none"
        center={[48.8584, 2.2945]}
        zoom={5}
        markers={[{ id: "office", lat: 48.8584, lng: 2.2945, label: "Office", tone: "accent" }]}
      />
    ),
  },
  {
    id: "fill",
    title: "Fills its parent",
    display: "frame",
    render: () => <MapView label="All hosts" tiles={TILES} size="fill" fit markers={HOSTS} />,
  },
]);
