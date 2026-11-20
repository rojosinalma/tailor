import type { Locator } from "playwright";
import { behaviour } from "../../src/behaviour";

/** The box of a picture once it has loaded, and the content box of the region it sits in. */
async function boxes(media: Locator) {
  await media.evaluate((el) => (el instanceof HTMLImageElement ? el.decode() : undefined));
  return media.evaluate((el) => {
    const box = el.getBoundingClientRect();
    const body = el.closest(".t-pane-body") ?? el.parentElement;
    if (!body) throw new Error("no body");
    const style = getComputedStyle(body);
    const inner = body.getBoundingClientRect();
    return {
      width: box.width,
      height: box.height,
      freeWidth: inner.width - Number.parseFloat(style.paddingLeft) - Number.parseFloat(style.paddingRight),
      freeHeight: inner.height - Number.parseFloat(style.paddingTop) - Number.parseFloat(style.paddingBottom),
      scrolls: body.scrollHeight > body.clientHeight + 1 || body.scrollWidth > body.clientWidth + 1,
      natural: el instanceof HTMLImageElement ? [el.naturalWidth, el.naturalHeight] : [0, 0],
    };
  });
}

export default behaviour("media-fit", {
  "a large picture fits the free width and height of its pane, ratio kept, nothing scrolls": async ({
    example,
    expect,
  }) => {
    const b = await boxes(example("default").getByRole("img", { name: "Drawing of 1200 × 900 pixels" }));
    expect(b.scrolls).toBe(false);
    expect(b.width).toBeLessThanOrEqual(b.freeWidth + 0.5);
    expect(b.height).toBeLessThanOrEqual(b.freeHeight + 0.5);
    expect(b.width / b.height).toBeCloseTo(1200 / 900, 1);
    // One side meets its limit: the picture is as large as the box allows.
    expect(Math.max(b.width / b.freeWidth, b.height / b.freeHeight)).toBeGreaterThan(0.99);
  },
  "a tall picture is limited by the height": async ({ example, expect }) => {
    const b = await boxes(example("tall").getByRole("img", { name: "Drawing of 600 × 1600 pixels" }));
    expect(b.scrolls).toBe(false);
    expect(b.height).toBeCloseTo(b.freeHeight, 0);
    expect(b.width / b.height).toBeCloseTo(600 / 1600, 1);
  },
  "a small picture keeps its natural size; contain scales it up": async ({ example, expect }) => {
    const small = await boxes(example("small").getByRole("img", { name: "Drawing of 240 × 180 pixels" }));
    expect([small.width, small.height]).toEqual([240, 180]);
    const up = await boxes(
      example("contain").getByRole("img", { name: "Drawing of 240 × 180 pixels, scaled up" }),
    );
    expect(up.scrolls).toBe(false);
    expect(up.width).toBeGreaterThan(240);
    expect(up.height).toBeLessThanOrEqual(up.freeHeight + 0.5);
  },
  "the empty slot shows until a picture is put in; a picture put in later fits too": async ({
    example,
    expect,
  }) => {
    const body = example("empty");
    await expect(body.getByText("No preview yet")).toBeVisible();
    // A page's code puts the result in the box, as after a render.
    await body.locator(".t-media-fit").evaluate((box) => {
      const img = document.createElement("img");
      img.alt = "Late picture";
      img.src = (document.querySelector('img[alt="Drawing of 1200 × 900 pixels"]') as HTMLImageElement).src;
      box.prepend(img);
    });
    await expect(body.getByText("No preview yet")).toBeHidden();
    const b = await boxes(body.getByRole("img", { name: "Late picture" }));
    expect(b.scrolls).toBe(false);
    expect(b.height).toBeLessThanOrEqual(b.freeHeight + 0.5);
    expect(b.width).toBeLessThanOrEqual(b.freeWidth + 0.5);
  },
  "an inline SVG stays inside its pane": async ({ example, expect }) => {
    const svg = example("svg").getByRole("img", { name: "Two boxes joined by a line" });
    const b = await boxes(svg);
    expect(b.scrolls).toBe(false);
    expect(b.width).toBeLessThanOrEqual(b.freeWidth + 0.5);
  },
});
