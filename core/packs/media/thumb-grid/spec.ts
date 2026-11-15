import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "thumb-grid",
  name: "Thumbnail grid",
  pack: "media",
  group: "display",
  description:
    "A grid of media tiles: images, video posters and files with a preview, each with a name and an optional line of details. A tile with an address or a select action is a link or a button over the whole tile; its actions stay clickable. An image that does not load shows a neutral placeholder.",
  root: "t-thumbs",
  parts: {
    "t-thumbs-item": "one tile: a figure with the preview and the caption",
    "t-thumbs-preview": "the box of a fixed ratio that holds the image",
    "t-thumbs-image": "the image, which covers the box",
    "t-thumbs-kind": "the play mark of a video or the badge of a file",
    "t-thumbs-caption": "the name and the details under the preview",
    "t-thumbs-name": "the name; as a link or a button its hit area covers the tile",
    "t-thumbs-meta": "a line of details, such as the size and the date",
    "t-thumbs-actions": "buttons over the corner of the preview",
  },
  props: {
    min: ["2xs", "xs", "sm"],
    ratio: ["1:1", "4:3", "16:9"],
    kind: ["image", "video", "file"],
  },
  html: "markup",
});
