import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "media-fit",
  name: "Media fit",
  pack: "core",
  group: "display",
  description:
    'Shows one image, video, canvas or SVG at the largest size that fits the free width and height of its box, with its aspect ratio kept, centred; it never grows a pane, a card or the page. fit="down" (default) never draws it above its natural size; fit="contain" also scales a small one up. Put it as the body of a Pane, a Split pane or a fill Page; in a box with no fixed height it fits the width only, and in the stacked Split of a fill Page on a phone it also stays within 70 % of the screen height. The empty slot shows while it holds no media, and hides by itself when an <img>, <video>, <canvas>, <svg> or <picture> is put into it.',
  root: "t-media-fit",
  parts: {
    "t-media-fit-empty":
      "what shows while there is no media, usually an EmptyState; hidden once media is in the box",
  },
  props: { fit: ["down", "contain"], empty: [], children: [] },
  html: "markup",
});
