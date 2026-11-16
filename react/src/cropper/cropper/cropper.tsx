import { arrowCounterclockwise, zoomIn, zoomOut } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import { type Area, aspectRatio, outputSize, stepZoom } from "@tailor/packs/cropper/cropper/logic";
import type spec from "@tailor/packs/cropper/cropper/spec";
import { type KeyboardEvent, useId, useRef, useState } from "react";
import EasyCrop from "react-easy-crop";
import { Button } from "../../core/button/button";
import { Segmented } from "../../core/segmented/segmented";
import { Slider } from "../../core/slider/slider";
import { Glyph } from "../../glyph";

export type CropAspect = (typeof spec.props.aspect)[number];

/** A crop in pixels of the source image. */
export type CropArea = Area;

export interface CropperProps {
  /** The image: a URL or a data: URI. */
  src: string;
  /** The accessible name of the crop frame, such as "Profile picture". */
  label: string;
  /** The aspect to start with; "free" keeps the aspect of the image. */
  aspect?: CropAspect;
  /** Aspects to pick from; a switch shows when there are several. */
  aspects?: readonly CropAspect[];
  shape?: (typeof spec.props.shape)[number];
  zoom?: number;
  defaultZoom?: number;
  onZoomChange?: (zoom: number) => void;
  minZoom?: number;
  maxZoom?: number;
  size?: (typeof spec.props.size)[number];
  /** The crop, in pixels of the source image, each time it settles. */
  onChange?: (area: CropArea) => void;
  /** The cropped image as a PNG file, each time the crop settles. */
  onCropped?: (image: Blob) => void;
}

export interface CropImageOptions {
  /** The file type, such as "image/jpeg". PNG when left out. */
  type?: string;
  /** 0 to 1, for JPEG and WebP. */
  quality?: number;
  /** The longest side of the result, in pixels. */
  maxSize?: number;
}

const ZOOM_STEP = 0.1;
const MOVE_STEP = 8;

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`The image could not load: ${src.slice(0, 60)}`));
    image.src = src;
  });

/** Draws one area of an image to a new image file. */
export async function cropImage(src: string, area: CropArea, options: CropImageOptions = {}): Promise<Blob> {
  const { type = "image/png", quality, maxSize } = options;
  const image = await loadImage(src);
  const size = outputSize(area, maxSize);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("No 2D canvas");
  context.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, size.width, size.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("The crop could not be drawn"))),
      type,
      quality,
    );
  });
}

/** An image cropper: the crop frame over the image, with zoom, aspect and reset under it. */
export function Cropper({
  src,
  label,
  aspect = "1:1",
  aspects,
  shape = "rect",
  zoom,
  defaultZoom,
  onZoomChange,
  minZoom = 1,
  maxZoom = 3,
  size = "md",
  onChange,
  onCropped,
}: CropperProps) {
  const start = defaultZoom ?? minZoom;
  const [ownZoom, setOwnZoom] = useState(start);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [shown, setShown] = useState<CropAspect>(aspect);
  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null);
  const hintId = useId();
  const latest = useRef(0);
  const current = zoom ?? ownZoom;

  const setZoom = (next: number): void => {
    const value = stepZoom(next, 0, minZoom, maxZoom);
    if (zoom === undefined) setOwnZoom(value);
    onZoomChange?.(value);
  };

  const settled = (pixels: CropArea): void => {
    onChange?.(pixels);
    if (!onCropped) return;
    const ticket = ++latest.current;
    void cropImage(src, pixels).then((blob) => {
      if (ticket === latest.current) onCropped(blob);
    });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === "+" || event.key === "=") setZoom(current + ZOOM_STEP);
    else if (event.key === "-" || event.key === "_") setZoom(current - ZOOM_STEP);
    else return;
    event.preventDefault();
  };

  const reset = (): void => {
    setCrop({ x: 0, y: 0 });
    setZoom(start);
    setShown(aspect);
  };

  return (
    <div className="t-cropper" data-size={size === "md" ? undefined : size}>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: the keys reach this box from the focused crop frame inside it. */}
      <div className="t-cropper-area" onKeyDown={onKeyDown}>
        <EasyCrop
          image={src}
          crop={crop}
          zoom={current}
          aspect={aspectRatio(shown, natural)}
          cropShape={shape}
          minZoom={minZoom}
          maxZoom={maxZoom}
          keyboardStep={MOVE_STEP}
          roundCropAreaPixels
          disableAutomaticStylesInjection
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_, pixels) => settled(pixels)}
          onMediaLoaded={(media) => setNatural({ width: media.naturalWidth, height: media.naturalHeight })}
          cropperProps={{ role: "group", "aria-label": label, "aria-describedby": hintId }}
        />
      </div>
      <p className="t-cropper-hint" id={hintId}>
        {t("cropperHint")}
      </p>
      <div className="t-cropper-controls">
        <div className="t-cropper-zoom">
          <Button
            variant="ghost"
            size="sm"
            icon={<Glyph body={zoomOut} />}
            label={t("cropperZoomOut")}
            disabled={current <= minZoom}
            onClick={() => setZoom(current - ZOOM_STEP)}
          />
          {/* The slider's control is its hit area; data-t-hit tells the page checks so. */}
          <div className="t-cropper-slider" data-t-hit="">
            <Slider
              label={t("cropperZoom")}
              value={current}
              min={minZoom}
              max={maxZoom}
              step={0.01}
              onValueChange={setZoom}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={<Glyph body={zoomIn} />}
            label={t("cropperZoomIn")}
            disabled={current >= maxZoom}
            onClick={() => setZoom(current + ZOOM_STEP)}
          />
        </div>
        {aspects && aspects.length > 1 ? (
          <Segmented
            label={t("cropperAspect")}
            size="sm"
            value={shown}
            onValueChange={(value) => {
              const found = aspects.find((a) => a === value);
              if (found) setShown(found);
            }}
            options={aspects.map((a) => ({ value: a, label: a === "free" ? t("cropperFree") : a }))}
          />
        ) : null}
        <Button size="sm" icon={<Glyph body={arrowCounterclockwise} />} onClick={reset}>
          {t("cropperReset")}
        </Button>
      </div>
    </div>
  );
}
