import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "lightbox",
  name: "Lightbox",
  pack: "media",
  group: "display",
  description:
    "A full-screen viewer for one image or video of a set, opened from a thumbnail: a caption, a counter, previous and next, close. Arrow keys, Home and End move; Escape closes and the focus returns to the thumbnail. On a touch screen a swipe to the side moves and a swipe down closes. Gallery is a thumbnail grid whose tiles open the lightbox.",
  root: "t-lightbox",
  parts: {
    "t-lightbox-bar": "the top row: counter, actions and the close button",
    "t-lightbox-counter": "the position in the set, such as 3 of 12",
    "t-lightbox-actions": "the actions for the item, such as a download link",
    "t-lightbox-close": "the close button",
    "t-lightbox-stage": "the area that shows the item and takes the swipes",
    "t-lightbox-media": "the image or the video, fitted to the screen",
    "t-lightbox-caption": "the caption under the item",
    "t-lightbox-prev": "the button to the previous item",
    "t-lightbox-next": "the button to the next item",
  },
  props: { kind: ["image", "video"] },
  html: "script",
});
