import { busy, once, register, upgrade } from "../runtime";

declare global {
  interface Window {
    Tailor: {
      upgrade: typeof upgrade;
      register: typeof register;
      busy: typeof busy;
      [key: string]: unknown;
    };
  }
}

once("boot", () => {
  window.Tailor = { ...(window.Tailor ?? {}), upgrade, register, busy };
  const start = (): void => {
    upgrade();
    new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) if (node instanceof HTMLElement) upgrade(node);
      }
    }).observe(document.body, { childList: true, subtree: true });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
});
