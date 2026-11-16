import { defineComponent, SIZES } from "@tailor/core/spec";

export const ASPECTS = ["1:1", "4:3", "16:9", "free"] as const;

export default defineComponent({
  id: "cropper",
  name: "Cropper",
  pack: "cropper",
  group: "inputs",
  description:
    "Crops an image: drag to move it, pinch, scroll or use the zoom slider to zoom, and pick an aspect. Arrow keys move the image and + and - zoom while the crop area has the focus. It reports the crop in pixels of the source image; cropImage() draws it to an image file.",
  root: "t-cropper",
  parts: {
    "t-cropper-area": "the box that holds the image and the crop frame; its height comes from data-size",
    "t-cropper-hint": "the short text that explains the keys, also the description of the crop frame",
    "t-cropper-controls": "the row of zoom, aspect and reset",
    "t-cropper-zoom": "the zoom slider between the zoom-out and zoom-in buttons",
    "t-cropper-slider": "the box around the zoom slider",
  },
  props: {
    aspect: ASPECTS,
    shape: ["rect", "round"],
    size: SIZES,
    src: [],
    label: [],
  },
  html: "none",
});
