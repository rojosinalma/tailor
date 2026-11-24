/**
 * The page rules of `inspect`, on small pages made for each rule: each rule finds its fault and stays quiet
 * on the form that tailor uses on purpose. Runs in the checks' browser.
 */
import { afterAll, beforeAll, expect, test } from "bun:test";
import type { Browser, Page } from "playwright";
import { connectBrowser } from "./browser";
import { inspect } from "./pages";

let browser: Browser;
let page: Page;

beforeAll(async () => {
  browser = await connectBrowser();
  page = await browser.newPage({ viewport: { width: 800, height: 600 } });
});
afterAll(async () => {
  await browser.close();
});

/** The rules that the page breaks, as "rule: message". */
async function rules(body: string): Promise<string[]> {
  await page.setContent(
    `<!doctype html><html><body style="margin:0;font:16px sans-serif">${body}</body></html>`,
  );
  await page.addScriptTag({ content: `window.__inspect = ${inspect.toString()};` });
  const found = await page.evaluate(() =>
    (window as unknown as { __inspect: typeof inspect }).__inspect(false, 44),
  );
  return found.map((p) => `${p.rule}: ${p.message}`);
}

const button = '<button style="width:300px;white-space:nowrap">Choose a file</button>';

test("a control cut by a box that clips is found", async () => {
  const found = await rules(`<div style="width:200px;overflow:hidden">${button}</div>`);
  expect(found.some((f) => f.startsWith("clipped:") && f.includes("Choose a file"))).toBe(true);
});

test("text cut with an ellipsis or a line clamp is on purpose", async () => {
  const long = "a long name that does not fit in its box at all";
  expect(
    await rules(
      `<div style="width:100px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis"><span>${long}</span></div>`,
    ),
  ).toEqual([]);
  expect(
    await rules(
      `<div style="width:100px;overflow:hidden;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2"><span>${long} ${long}</span></div>`,
    ),
  ).toEqual([]);
});

test("a control past the side of a box that scrolls in both directions is found", async () => {
  // The fault of the file picker in a tool page's pane: the pane scrolls, so no edge of the page was crossed.
  const found = await rules(`<div style="width:200px;height:200px;overflow:auto">${button}</div>`);
  expect(found.some((f) => f.startsWith("clipped:") && f.includes("scrolls in both directions"))).toBe(true);
});

test("a box that scrolls sideways only, and code in a pane, scroll on purpose", async () => {
  expect(
    await rules(
      `<div style="width:200px;overflow:auto hidden"><div style="display:flex">${button}${button}</div></div>`,
    ),
  ).toEqual([]);
  expect(
    await rules(
      `<div style="width:200px;height:200px;overflow:auto"><pre>a line of code that is much longer than the pane</pre></div>`,
    ),
  ).toEqual([]);
});

test("text below the end of a box that scrolls down is not cut", async () => {
  expect(
    await rules(`<div style="width:200px;height:50px;overflow:auto"><p>one</p><p>two</p><p>three</p></div>`),
  ).toEqual([]);
});

const table = (cell: string) =>
  `<table class="t-table" style="width:240px"><tbody><tr><td style="overflow-wrap:anywhere">build_artifact_cache_replica_eu_west_3_2026_11_15</td><td ${cell}>web-1</td><td>12 minutes ago</td></tr></tbody></table>`;

test("a short name that a squeezed table breaks at its hyphen is found", async () => {
  const found = await rules(table(""));
  expect(found.some((f) => f.startsWith("broken-word:") && f.includes("web-1"))).toBe(true);
});

test("a short name that stays on one line is not a problem", async () => {
  expect(await rules(table('style="white-space:nowrap"'))).toEqual([]);
});

test("the controls under an open modal dialog do not count", async () => {
  const body = `<button style="position:fixed;top:0;left:0;width:200px;height:60px">Under</button><dialog id="d" style="margin:0;top:0;left:0;padding:0"><button style="width:200px;height:60px">In the dialog</button></dialog><script>document.getElementById("d").showModal()</script>`;
  expect((await rules(body)).filter((f) => f.startsWith("overlap:"))).toEqual([]);
});

test("the controls under an open popup that is not modal do not count; the popup's own controls do", async () => {
  const under = `<button style="position:fixed;top:0;left:0;width:200px;height:60px">Under</button><button style="position:fixed;top:70px;left:0;width:200px;height:60px">Also under</button>`;
  const popup = (inside: string) =>
    `${under}<div id="p" popover="manual" style="margin:0;inset:0 auto auto 0;padding:0;width:220px;height:140px">${inside}</div><script>document.getElementById("p").showPopover()</script>`;
  const one = '<button style="width:200px;height:60px">In the popup</button>';
  expect((await rules(popup(one))).filter((f) => f.startsWith("overlap:"))).toEqual([]);
  // A Base UI popup is a positioned box, not a popover element.
  const positioner = `${under}<div class="t-popup-positioner" style="position:fixed;top:0;left:0;width:220px">${one}</div>`;
  expect((await rules(positioner)).filter((f) => f.startsWith("overlap:"))).toEqual([]);
  const two = `<button style="position:absolute;top:0;left:0;width:200px;height:60px">First</button><button style="position:absolute;top:20px;left:0;width:200px;height:60px">Second</button>`;
  const found = (await rules(popup(two))).filter((f) => f.startsWith("overlap:"));
  expect(found.length).toBe(1);
  expect(found[0]).toContain('"First"');
});

test("a longer word broken in its middle is found; broken after its hyphen it is not", async () => {
  const cell = (width: string) =>
    `<table class="t-table"><tbody><tr><td style="width:${width};overflow-wrap:anywhere">nas-documents</td></tr></tbody></table>`;
  const middle = await rules(cell("6ch"));
  expect(middle.some((f) => f.startsWith("broken-word:") && f.includes('"nas-documents"'))).toBe(true);
  expect(await rules(cell("10ch").replace("anywhere", "break-word"))).toEqual([]);
});

test("plain text at the side of a bar of the frame is found; an icon button there is not", async () => {
  const bar = (end: string) =>
    `<header class="t-shell-bar" style="display:flex;justify-content:space-between;padding:0 8px;width:390px"><span>Brand name</span>${end}</header>`;
  const found = await rules(bar("<span><span>Ready</span></span>"));
  expect(found.some((f) => f.startsWith("edge-text:") && f.includes("Ready"))).toBe(true);
  expect(
    (await rules(bar('<button aria-label="Menu">M</button>'))).filter((f) => f.includes("Ready")),
  ).toEqual([]);
});

test("content that reaches past its grid cell into the next column is found", async () => {
  const grid = (cell: string) =>
    `<div class="t-grid" style="display:grid;grid-template-columns:100px 100px;width:200px"><div style="${cell}"><span style="white-space:nowrap">a long state that does not fit</span></div><div>next</div></div>`;
  expect((await rules(grid(""))).some((f) => f.startsWith("spill:"))).toBe(true);
  expect(
    (await rules(grid("overflow:hidden;text-overflow:ellipsis"))).filter((f) => f.startsWith("spill:")),
  ).toEqual([]);
});
