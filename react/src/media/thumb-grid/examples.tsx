import { more } from "@tailor/core/glyphs.gen";
import { Button } from "../../core/button/button";
import { Stack } from "../../core/stack/stack";
import { defineExamples } from "../../examples";
import { Glyph } from "../../glyph";
import { ThumbGrid, type ThumbItem } from "./thumb-grid";

/** Flat sample pictures in a few fixed colours: sample content, not UI, so it may name its colours. */
const SCENES = [
  ["#264653", "#e9c46a", "#2a9d8f"],
  ["#3d405b", "#f2cc8f", "#81b29a"],
  ["#1d3557", "#f1faee", "#457b9d"],
  ["#6d597a", "#ffb4a2", "#b56576"],
  ["#283618", "#fefae0", "#606c38"],
  ["#5f0f40", "#fb8b24", "#9a031e"],
] as const;

/** A sample picture as a data: address, so the examples load no file and need no network. */
export function sampleImage(n: number, ratio: "1:1" | "4:3" | "16:9" = "4:3"): string {
  const [w, h] = ratio === "1:1" ? [120, 120] : ratio === "16:9" ? [160, 90] : [160, 120];
  const scene = SCENES[n % SCENES.length] ?? SCENES[0];
  const [sky, sun, land] = scene;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w * 4}" height="${h * 4}" viewBox="0 0 ${w} ${h}">` +
    `<rect width="${w}" height="${h}" fill="${sky}"/>` +
    `<circle cx="${w * (0.25 + (n % 3) * 0.25)}" cy="${h * 0.32}" r="${h * 0.14}" fill="${sun}"/>` +
    `<polygon points="0,${h} ${w * 0.3},${h * 0.5} ${w * 0.55},${h * 0.8} ${w * 0.75},${h * 0.45} ${w},${h * 0.75} ${w},${h}" fill="${land}"/>` +
    "</svg>";
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** An address that fails at once and asks the server for nothing. */
const broken = "data:text/plain,not-an-image";

const photos = (count: number, ratio: "1:1" | "4:3" | "16:9" = "4:3"): ThumbItem[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `p${i}`,
    src: sampleImage(i, ratio),
    alt: `Sample photo ${i + 1}`,
    caption: `photo-${String(i + 1).padStart(3, "0")}.jpg`,
    meta: `${(1.2 + i * 0.4).toFixed(1)} MB · Nov ${15 - i}, 2026`,
    to: `#photo-${i + 1}`,
  }));

export default defineExamples("thumb-grid", [
  {
    id: "default",
    title: "Links, 4:3",
    note: "The whole tile is the link. The current one is marked.",
    render: () => (
      <ThumbGrid label="Photos" items={photos(6).map((p, i) => (i === 1 ? { ...p, selected: true } : p))} />
    ),
  },
  {
    id: "square",
    title: "Square, small tiles, no caption",
    note: "Without a caption, the alt text names the link.",
    render: () => (
      <ThumbGrid
        label="Avatars"
        min="2xs"
        ratio="1:1"
        items={photos(8, "1:1").map(({ caption: _c, meta: _m, ...p }) => p)}
      />
    ),
  },
  {
    id: "wide",
    title: "16:9 videos, wide tiles",
    render: () => (
      <ThumbGrid
        label="Recordings"
        min="sm"
        ratio="16:9"
        items={[0, 1, 2].map((i) => ({
          id: `v${i}`,
          src: sampleImage(i + 2, "16:9"),
          alt: `Poster of recording ${i + 1}`,
          caption: `backup-run-${i + 1}.mp4`,
          meta: `0:${String(42 + i * 7)} · nas`,
          kind: "video" as const,
          to: `#recording-${i + 1}`,
        }))}
      />
    ),
  },
  {
    id: "select",
    title: "Buttons that select",
    note: "A tile with a select action is a toggle button.",
    render: () => (
      <ThumbGrid
        label="Pick a cover"
        min="2xs"
        items={photos(4).map(({ to: _t, ...p }, i) => ({ ...p, onSelect: () => {}, selected: i === 0 }))}
      />
    ),
  },
  {
    id: "states",
    title: "Loading, broken, a file, long names and actions",
    note: "An image that does not load shows a neutral placeholder.",
    render: () => (
      <ThumbGrid
        label="Uploads"
        items={[
          { id: "l", src: "", alt: "Loading", loading: true },
          {
            id: "b",
            src: broken,
            alt: "Missing photo",
            caption: "missing.jpg",
            meta: "0 KB",
            to: "#missing",
          },
          {
            id: "f",
            src: sampleImage(4),
            alt: "First page of the report",
            caption: "report-2026-11.pdf",
            meta: "320 KB · alice",
            kind: "file",
            to: "#report",
          },
          {
            id: "a",
            src: sampleImage(5),
            alt: "Rack in the server room",
            caption: "server-room-rack-web-1-and-nas-front-view-after-the-move.jpg",
            meta: "a very long line of details that does not fit · 4.8 MB · Nov 12, 2026",
            to: "#rack",
            actions: <Button size="sm" icon={<Glyph body={more} />} label="More for the rack photo" />,
          },
        ]}
      />
    ),
  },
  {
    id: "static",
    title: "Plain tiles",
    note: "With no address and no action, a tile is a figure only.",
    render: () => <ThumbGrid label="Screens" min="2xs" items={photos(3).map(({ to: _t, ...p }) => p)} />,
  },
  {
    id: "narrow",
    title: "In a narrow box",
    width: "sm",
    render: () => (
      <Stack>
        <ThumbGrid label="Recent photos" min="2xs" items={photos(4)} />
      </Stack>
    ),
  },
]);
