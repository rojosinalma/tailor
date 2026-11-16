/** The logic of the cropper: aspects, zoom steps and the size of the cropped image. Plain TypeScript, no DOM. */

export interface Area {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** The ratio of an aspect such as "16:9"; for "free", the ratio of the image itself. */
export function aspectRatio(aspect: string, image: { width: number; height: number } | null): number {
  const match = /^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/.exec(aspect);
  if (match) {
    const ratio = Number(match[1]) / Number(match[2]);
    if (Number.isFinite(ratio) && ratio > 0) return ratio;
  }
  return image && image.width > 0 && image.height > 0 ? image.width / image.height : 1;
}

/** The zoom one step in or out, kept between min and max. */
export const stepZoom = (zoom: number, by: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, Math.round((zoom + by) * 100) / 100));

/** The size of the cropped image: the area, scaled down so that its longer side is at most maxSize. */
export function outputSize(area: Area, maxSize?: number): { width: number; height: number } {
  const longer = Math.max(area.width, area.height);
  const scale = maxSize && longer > maxSize ? maxSize / longer : 1;
  return {
    width: Math.max(1, Math.round(area.width * scale)),
    height: Math.max(1, Math.round(area.height * scale)),
  };
}
