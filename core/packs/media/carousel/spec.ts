import { defineComponent, GAPS } from "@tailor/core/spec";

export default defineComponent({
  id: "carousel",
  name: "Carousel",
  pack: "media",
  group: "display",
  description:
    "A row of slides that moves one view at a time: by swipe, by the previous and next buttons, by the dots or by the arrow keys. It snaps to the slides and shows fewer of them in a narrow container. It never moves by itself: content that moves on its own needs a pause control, so there is no autoplay.",
  root: "t-carousel",
  parts: {
    "t-carousel-track": "the row that scrolls sideways and snaps to the slides",
    "t-carousel-slide": "one slide",
    "t-carousel-controls": "the row under the track: previous, the dots, next",
    "t-carousel-prev": "the button to the previous view",
    "t-carousel-next": "the button to the next view",
    "t-carousel-dots": "one dot per view; the current one is marked",
    "t-carousel-dot": "one dot",
  },
  props: { perView: ["1", "2", "3"], gap: GAPS },
  html: "script",
});
