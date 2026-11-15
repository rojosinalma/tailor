import { Button } from "../../core/button/button";
import { defineExamples } from "../../examples";
import { sampleImage } from "../thumb-grid/examples";
import { Gallery, type GalleryItem, Lightbox } from "./lightbox";

const PLACES = [
  "Harbour",
  "Hill path",
  "Old bridge",
  "Lake shore",
  "Forest edge",
  "Dunes",
  "Valley",
  "Ridge",
];

const album = (count: number): GalleryItem[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `a${i}`,
    src: sampleImage(i),
    alt: `${PLACES[i % PLACES.length]}, sample photo ${i + 1}`,
    caption: `${PLACES[i % PLACES.length]} at dawn`,
    meta: `Nov ${15 - i}, 2026`,
  }));

export default defineExamples("lightbox", [
  {
    id: "gallery",
    title: "Gallery with captions",
    note: "A tile opens the viewer at its photo. Arrow keys, Home and End move; Escape closes. On a touch screen, swipe to the side or down.",
    render: () => <Gallery label="Trip photos" items={album(6)} download />,
  },
  {
    id: "loop",
    title: "Looping, square tiles",
    note: "With loop, next goes on from the last photo to the first.",
    render: () => <Gallery label="Loop album" items={album(4)} ratio="1:1" min="2xs" loop />,
  },
  {
    id: "trigger",
    title: "Opened from a button",
    render: () => (
      <Lightbox
        label="Release screenshots"
        trigger={<Button>Show screenshots</Button>}
        items={[0, 1, 2].map((i) => ({
          src: sampleImage(i + 3, "16:9"),
          alt: `Screenshot ${i + 1} of the release`,
          caption: `Screen ${i + 1} of the 2026.11 release`,
        }))}
      />
    ),
  },
  {
    id: "narrow",
    title: "In a narrow box",
    width: "sm",
    render: () => <Gallery label="Narrow album" items={album(3)} min="2xs" />,
  },
]);
