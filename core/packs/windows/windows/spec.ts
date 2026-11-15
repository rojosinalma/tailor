import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "windows",
  name: "Windows",
  pack: "windows",
  group: "feedback",
  description:
    "Floating windows over the page for a document, a viewer or a tool that stays open: they move, resize, minimise to a tray and maximise, and the page behind stays usable. Keys: F6 and Shift+F6 move the focus between the page and the open windows; on a title bar the arrow keys move the window, Alt+arrow keys resize it, Shift takes a larger step and Enter maximises or restores it. On a phone each window takes the full screen.",
  root: "t-windows",
  parts: {
    "t-window": "one window; data-focused on the window that holds the focus",
    "t-window-bar": "the title bar: drag it to move the window, focus it to move and resize with the keys",
    "t-window-icon": "the icon in the title bar",
    "t-window-title": "the title",
    "t-window-actions": "the minimise, maximise and close buttons",
    "t-window-body": "the content, which scrolls by itself",
    "t-window-handle": "an invisible edge or corner to drag for a new size",
    "t-windows-tray": "the row of minimised windows at the bottom end corner",
    "t-windows-bubble": "one minimised window in the tray: restore and close buttons",
  },
  props: {
    handle: ["n", "s", "e", "w", "ne", "nw", "se", "sw"],
  },
  html: "none",
});
