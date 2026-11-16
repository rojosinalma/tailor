import { useState } from "react";
import { Button } from "../../core/button/button";
import { Stack } from "../../core/stack/stack";
import { defineExamples } from "../../examples";
import { type CropArea, Cropper, cropImage } from "./cropper";

/** A sample picture as an SVG data: URI: hills under a sun, with a grid to see the crop. */
function sampleImage(width: number, height: number): string {
  const lines = Array.from({ length: 9 }, (_, i) => {
    const x = ((i + 1) * width) / 10;
    return `<path d="M${x} 0V${height}" stroke="#ffffff" stroke-opacity="0.15"/>`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#4a7fb5"/><circle cx="${width * 0.7}" cy="${height * 0.3}" r="${height * 0.12}" fill="#f2c94c"/><path d="M0 ${height * 0.75} Q${width * 0.25} ${height * 0.5} ${width * 0.5} ${height * 0.72} T${width} ${height * 0.65} V${height} H0Z" fill="#3c8d5a"/><path d="M0 ${height * 0.9} Q${width * 0.4} ${height * 0.7} ${width} ${height * 0.88} V${height} H0Z" fill="#2d6b44"/>${lines}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const PHOTO = sampleImage(800, 600);

const areaText = (area: CropArea | null): string =>
  area ? `Crop: ${area.width} × ${area.height} at ${area.x}, ${area.y}` : "Crop: none yet";

function Reported(props: { aspects?: boolean; maxSize?: number }) {
  const [area, setArea] = useState<CropArea | null>(null);
  const [made, setMade] = useState("No image made yet.");
  const make = async (): Promise<void> => {
    if (!area) return;
    const blob = await cropImage(PHOTO, area, { maxSize: props.maxSize });
    const bitmap = await createImageBitmap(blob);
    setMade(`Made a ${blob.type} image of ${bitmap.width} × ${bitmap.height}.`);
  };
  return (
    <Stack gap="2">
      <Cropper
        src={PHOTO}
        label="Header picture"
        aspect="16:9"
        aspects={props.aspects ? ["16:9", "4:3", "1:1", "free"] : undefined}
        onChange={setArea}
      />
      <p aria-live="polite">{areaText(area)}</p>
      <div>
        <Button onClick={() => void make()}>Make the image</Button>
      </div>
      <p aria-live="polite">{made}</p>
    </Stack>
  );
}

export default defineExamples("cropper", [
  {
    id: "default",
    title: "Square crop",
    note: "Drag the image, or focus the frame and use the arrow keys; + and - zoom.",
    render: () => <Cropper src={PHOTO} label="Profile picture" />,
  },
  {
    id: "aspects",
    title: "Several aspects, with the crop in pixels",
    render: () => <Reported aspects />,
  },
  {
    id: "max-size",
    title: "An image of at most 200 pixels",
    render: () => <Reported maxSize={200} />,
  },
  {
    id: "round",
    title: "Round, small",
    render: () => <Cropper src={PHOTO} label="Avatar" shape="round" size="sm" defaultZoom={1.5} />,
  },
  {
    id: "large",
    title: "Large",
    render: () => <Cropper src={PHOTO} label="Cover picture" aspect="4:3" size="lg" />,
  },
  {
    id: "narrow",
    title: "In a narrow box",
    width: "sm",
    render: () => <Cropper src={PHOTO} label="Narrow picture" aspects={["1:1", "4:3", "16:9"]} />,
  },
]);
