import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "pwa-install",
  name: "Install app",
  pack: "pwa",
  group: "feedback",
  description:
    'The "Install app" action, never a popup of its own. It shows only when the app is not installed and the browser can install it: with the browser\'s install prompt (Chromium), or with a small dialog of the manual steps (Safari on iOS and macOS, Firefox on Android). React: <PwaProvider worker="/sw.js"> at the app root, then <PwaInstall /> as a button, or pwaInstallMenuItem(usePwa()) as an item of a menu (null when it must not show). HTML: window.TAILOR_PWA = { worker: "/sw.js" } before the scripts, and <button class="t-btn t-pwa-install" data-t="pwa-install" hidden>Install app</button>.',
  root: "t-pwa-install",
  html: "script",
});
