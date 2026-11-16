import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "shell-base",
  name: "Shell parts",
  pack: "core",
  group: "shells",
  description:
    "What every shell shares: the frame bound to the visible screen, the skip link, the brand, the navigation links, the footer facts and the theme controls. Apps pick a shell (topnav, sidenav, bare); these parts are for shells.",
  root: "t-shell",
  parts: {
    "t-shell-skip": "the skip link, the first focusable element; visible only while it has the focus",
    "t-shell-bar": "a top bar (header)",
    "t-shell-brand": "the brand: a link home with the mark and the name",
    "t-shell-brand-mark": "the icon or logo of the brand",
    "t-shell-brand-name": "the name of the brand; it truncates",
    "t-shell-nav": "a navigation region (nav with aria-label)",
    "t-shell-group": "a group of links with its label",
    "t-shell-group-label": "the label of a group",
    "t-shell-list": "the list of links of a group",
    "t-shell-sub": "the sub-items of a link, indented under it",
    "t-shell-link":
      'one navigation link; the current page has aria-current="page", the parent of the current page data-current-section',
    "t-shell-icon": "the icon of a link",
    "t-shell-initial": "the first letter of the label, for a link without an icon",
    "t-shell-label": "the text of a link",
    "t-shell-chevron": "the chevron of a link that opens its sub-items",
    "t-shell-actions": "the global actions: search, user menu",
    "t-shell-main": "the content region (main); it never scrolls, the Page inside does",
    "t-shell-footer": "the footer facts and the theme controls",
    "t-shell-facts": "the list of footer facts",
    "t-shell-fact": "one fact: a version, a link",
    "t-shell-theme": "holds the theme controls",
    "t-shell-sidebar": "a side column",
    "t-shell-menu-button": "the button that opens the navigation drawer on a phone",
  },
  props: {
    shell: ["topnav", "sidenav", "bare", "workspace"],
    theme: ["skin", "palette", "mode"],
    contained: [],
  },
  html: "script",
});
