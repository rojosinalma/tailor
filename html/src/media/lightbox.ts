import { chevronLeft, chevronRight, close, download } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import { fill, keyTarget, stepTo, swipeAction } from "@tailor/packs/media/lightbox/logic";
import { glyph, h, once } from "../runtime";

/**
 * The lightbox of the HTML kit. Links marked data-t-lightbox="GROUP" make up a set; a click on one opens
 * the viewer of its group at that item. Without the script, each link opens its file.
 */

interface Item {
  readonly src: string;
  readonly alt: string;
  readonly caption: string;
  readonly video: boolean;
}

interface Viewer {
  open(links: HTMLAnchorElement[], index: number, opener: HTMLElement): void;
}

const viewers = new Map<string, Viewer>();

const linksOf = (group: string): HTMLAnchorElement[] =>
  [...document.querySelectorAll<HTMLAnchorElement>("a[data-t-lightbox]")].filter(
    (a) => a.dataset.tLightbox === group,
  );

const itemOf = (a: HTMLAnchorElement): Item => ({
  src: a.getAttribute("href") ?? "",
  alt:
    a.getAttribute("aria-label") ||
    a.querySelector("img")?.alt ||
    a.closest("figure")?.querySelector("img")?.alt ||
    (a.textContent ?? "").trim(),
  caption: a.dataset.caption ?? "",
  video: a.dataset.kind === "video",
});

const iconButton = (part: string, body: string, label: string): HTMLButtonElement =>
  h(
    "button",
    { type: "button", class: `t-btn ${part}`, "data-icon-only": "", "aria-label": label },
    glyph(body),
  );

function build(label: string): Viewer {
  let items: Item[] = [];
  let index = 0;
  let loop = false;
  let opener: HTMLElement | null = null;

  const counter = h("span", { class: "t-lightbox-counter", "aria-live": "polite" });
  const closeButton = iconButton("t-lightbox-close", close, t("close"));
  closeButton.dataset.tClose = "";
  closeButton.autofocus = true;
  const save = h(
    "a",
    { class: "t-btn", "data-icon-only": "", "aria-label": t("download"), download: true },
    glyph(download),
  );
  const actions = h("div", { class: "t-lightbox-actions" }, save, closeButton);
  const caption = h("figcaption", { class: "t-lightbox-caption" });
  const prev = iconButton("t-lightbox-prev", chevronLeft, t("previous"));
  const next = iconButton("t-lightbox-next", chevronRight, t("next"));
  let media: HTMLElement = h("img", { class: "t-lightbox-media" });
  const stage = h("figure", { class: "t-lightbox-stage" }, media, caption, prev, next);
  // data-t="dialog" brings the focus behaviour of the dialog: Tab stays inside, data-t-close closes.
  const dialog = h(
    "dialog",
    { class: "t-lightbox", "data-t": "dialog", "aria-label": label },
    h("div", { class: "t-lightbox-bar" }, counter, actions),
    stage,
  );
  document.body.append(dialog);

  const render = (direction?: "next" | "prev"): void => {
    const item = items[index];
    if (!item) return;
    counter.hidden = items.length < 2;
    counter.textContent = fill(t("itemOf"), { index: index + 1, count: items.length });
    save.href = item.src;
    const shown = item.video
      ? h("video", { class: "t-lightbox-media", src: item.src, "aria-label": item.alt, controls: true })
      : h("img", { class: "t-lightbox-media", src: item.src, alt: item.alt, draggable: "false" });
    if (direction) shown.dataset.direction = direction;
    media.replaceWith(shown);
    media = shown;
    caption.textContent = item.caption;
    caption.hidden = !item.caption;
    prev.hidden = stepTo(index, -1, items.length, loop) === null;
    next.hidden = stepTo(index, 1, items.length, loop) === null;
  };

  const go = (target: number | null): void => {
    if (target === null || target === index) return;
    const direction = target > index ? "next" : "prev";
    const active = document.activeElement;
    index = target;
    render(direction);
    // A button that hides at an end hands the focus to the other one.
    if (active === prev && prev.hidden) next.focus();
    if (active === next && next.hidden) prev.focus();
  };

  prev.addEventListener("click", () => go(stepTo(index, -1, items.length, loop)));
  next.addEventListener("click", () => go(stepTo(index, 1, items.length, loop)));
  dialog.addEventListener("keydown", (event) => {
    if (event.target instanceof HTMLVideoElement) return;
    const target = keyTarget(event.key, index, items.length, loop);
    if (target === null) return;
    event.preventDefault();
    go(target);
  });

  let swipe: { id: number; x: number; y: number } | null = null;
  stage.addEventListener("pointerdown", (event) => {
    const onControl = event.target instanceof Element && event.target.closest("button, a, video");
    swipe =
      event.isPrimary && !onControl ? { id: event.pointerId, x: event.clientX, y: event.clientY } : null;
  });
  stage.addEventListener("pointercancel", () => {
    swipe = null;
  });
  stage.addEventListener("pointerup", (event) => {
    const start = swipe;
    swipe = null;
    if (!start || start.id !== event.pointerId) return;
    const action = swipeAction(event.clientX - start.x, event.clientY - start.y);
    if (action === "close") dialog.close();
    else if (action) go(stepTo(index, action === "next" ? 1 : -1, items.length, loop));
  });
  dialog.addEventListener("close", () => opener?.focus());

  return {
    open(links, at, from) {
      items = links.map(itemOf);
      index = Math.min(Math.max(0, at), items.length - 1);
      loop = links.some((a) => a.dataset.loop !== undefined);
      save.hidden = !links.some((a) => a.dataset.download !== undefined);
      opener = from;
      render();
      dialog.showModal();
    },
  };
}

once("lightbox", () => {
  document.addEventListener("click", (event) => {
    // A click with a modifier key keeps its browser meaning, such as a new tab.
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const el =
      event.target instanceof Element
        ? event.target.closest<HTMLElement>("a[data-t-lightbox], [data-t-lightbox-open]")
        : null;
    if (!el) return;
    const group = el.dataset.tLightbox ?? el.dataset.tLightboxOpen ?? "";
    const links = linksOf(group);
    const first = links[0];
    if (!first) return;
    event.preventDefault();
    const at =
      el instanceof HTMLAnchorElement && el.dataset.tLightbox !== undefined
        ? links.indexOf(el)
        : Number(el.dataset.tLightboxIndex ?? 0);
    let viewer = viewers.get(group);
    if (!viewer) {
      viewer = build(first.dataset.label ?? "");
      viewers.set(group, viewer);
    }
    viewer.open(links, at, el);
  });
});
