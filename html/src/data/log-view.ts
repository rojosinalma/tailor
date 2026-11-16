import { arrowDown, check, copy, search as searchGlyph } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import {
  detectLevel,
  LEVEL_TONE,
  type Level,
  levelOf,
  markMatches,
  matchesQuery,
  parseAnsi,
  type Segment,
  stripAnsi,
} from "@tailor/packs/data/log-view/logic";
import { glyph, h, register } from "../runtime";

interface Raw {
  readonly text: string;
  readonly time?: string;
  readonly level?: Level;
}

interface Record_ extends Raw {
  readonly el: HTMLElement;
  readonly body: HTMLElement;
  readonly plain: string;
}

interface LogApi {
  append(text: string): void;
}

const COPIED_MS = 1500;
const END_SLACK = 4;
const apis = new WeakMap<Element, LogApi>();

const runs = (segments: readonly Segment[]): (Node | string)[] =>
  segments.map((s) =>
    s.mark
      ? h("mark", { class: "t-log-mark" }, s.text)
      : s.fg || s.bold || s.dim
        ? h("span", { "data-fg": s.fg, "data-bold": s.bold, "data-dim": s.dim }, s.text)
        : s.text,
  );

/** The lines of the nodes that the page wrote or appended: text lines, or list items with a level and a time. */
function rawLines(nodes: readonly Node[]): Raw[] {
  return nodes.flatMap((node): Raw[] => {
    if (node instanceof HTMLLIElement)
      return [
        {
          text: node.textContent ?? "",
          time: node.dataset.time,
          level: levelOf(node.dataset.level ?? ""),
        },
      ];
    const lines = (node.textContent ?? "").split("\n");
    if (lines.at(-1) === "") lines.pop();
    return lines.map((text) => ({ text }));
  });
}

/** Adds follow, a filter, copy and ANSI colours to a log that the server wrote. */
register("log", (source) => {
  const maxLines = Number(source.dataset.maxLines) || 2000;
  const isList = source instanceof HTMLOListElement || source instanceof HTMLUListElement;
  let follow = source.dataset.follow !== "off";
  let query = "";
  const records: Record_[] = [];

  const input = h("input", {
    type: "search",
    class: "t-input-native",
    placeholder: t("filter"),
    "aria-label": t("filter"),
    autocomplete: "off",
  });
  const search = h(
    "div",
    {
      class: "t-control t-input-group t-search",
      "data-t": "search",
      "data-size": "sm",
      "data-shortcut": "off",
    },
    h("span", { class: "t-input-addon t-search-icon" }, glyph(searchGlyph)),
    input,
  );
  const toggle = h("input", { type: "checkbox", role: "switch", class: "t-switch-input", checked: follow });
  const copyLabel = h("span", { class: "t-btn-label", "aria-live": "polite" }, t("copy"));
  let copyIcon = glyph(copy);
  const copyButton = h(
    "button",
    { type: "button", class: "t-btn", "data-variant": "ghost", "data-size": "sm" },
    copyIcon,
    copyLabel,
  );
  const showCopied = (on: boolean): void => {
    const next = glyph(on ? check : copy);
    copyIcon.replaceWith(next);
    copyIcon = next;
    copyLabel.textContent = on ? t("copied") : t("copy");
  };
  const bar = h(
    "div",
    { class: "t-log-bar" },
    search,
    h("label", { class: "t-switch" }, toggle, h("span", { class: "t-switch-label" }, t("follow"))),
    copyButton,
  );
  const view = h("section", {
    class: "t-log-view",
    "aria-label": source.getAttribute("aria-label") ?? undefined,
    tabindex: "0",
  });
  const jump = h(
    "button",
    {
      type: "button",
      class: "t-btn t-log-jump",
      "data-variant": "primary",
      "data-size": "sm",
      hidden: follow,
    },
    glyph(arrowDown),
    h("span", { class: "t-btn-label" }, t("jumpToEnd")),
  );
  const root = h("div", { class: "t-log", "data-wrap": source.hasAttribute("data-wrap") }, bar, view, jump);

  const initial = rawLines([...source.childNodes]);
  source.before(root);
  view.append(source);
  source.classList.replace("t-log", "t-log-lines");
  source.removeAttribute("aria-label");
  source.replaceChildren();

  let lastTop = 0;
  const toEnd = (): void => {
    view.scrollTop = view.scrollHeight;
    lastTop = view.scrollTop;
  };
  const setFollow = (on: boolean): void => {
    follow = on;
    toggle.checked = on;
    jump.hidden = on;
    if (on) toEnd();
  };

  const paint = (record: Record_): void => {
    const match = matchesQuery(record.plain, query);
    record.el.hidden = !match;
    record.body.replaceChildren(...runs(markMatches(parseAnsi(record.text), match ? query : "")));
  };

  const add = (raws: readonly Raw[]): void => {
    for (const raw of raws) {
      const plain = stripAnsi(raw.text);
      const level = raw.level ?? detectLevel(plain);
      const body = h("span", { class: "t-log-text" });
      const el = h(
        isList ? "li" : "span",
        { class: "t-log-line", "data-level": level, "data-tone": level ? LEVEL_TONE[level] : undefined },
        raw.time ? h("span", { class: "t-log-time" }, raw.time) : null,
        raw.level ? h("span", { class: "t-log-level" }, raw.level.toUpperCase()) : null,
        body,
      );
      const record = { ...raw, el, body, plain };
      paint(record);
      records.push(record);
      source.append(el);
    }
    for (const old of records.splice(0, Math.max(0, records.length - maxLines))) old.el.remove();
    if (follow) toEnd();
  };

  input.addEventListener("input", () => {
    query = input.value;
    for (const record of records) paint(record);
    if (follow) toEnd();
  });
  toggle.addEventListener("change", () => setFollow(toggle.checked));
  jump.addEventListener("click", () => {
    setFollow(true);
    view.focus();
  });
  view.addEventListener("scroll", () => {
    const atEnd = view.scrollHeight - view.scrollTop - view.clientHeight <= END_SLACK;
    // Scrolling up, away from the end, is the user's: follow stops.
    if (follow && !atEnd && view.scrollTop < lastTop) setFollow(false);
    lastTop = view.scrollTop;
  });

  let timer: ReturnType<typeof setTimeout> | undefined;
  copyButton.addEventListener("click", () => {
    const text = records
      .filter((r) => !r.el.hidden)
      .map((r) => [r.time, r.level?.toUpperCase(), r.plain].filter(Boolean).join(" "))
      .join("\n");
    navigator.clipboard.writeText(text).then(
      () => {
        showCopied(true);
        clearTimeout(timer);
        timer = setTimeout(() => showCopied(false), COPIED_MS);
      },
      // Without clipboard access the button stays as it is.
      () => undefined,
    );
  });

  // Lines that the page appended to the element: everything that is not a drawn line yet.
  source.addEventListener("t:append", () => {
    const fresh = [...source.childNodes].filter(
      (node) => !(node instanceof HTMLElement && node.classList.contains("t-log-line")),
    );
    for (const node of fresh) node.remove();
    add(rawLines(fresh));
  });

  const api: LogApi = { append: (text) => add(rawLines([document.createTextNode(text)])) };
  apis.set(source, api);
  apis.set(root, api);
  add(initial);
  setFollow(follow);
});

/** The page's handle on a log: `window.Tailor.log(element).append(text)`. */
if (window.Tailor)
  window.Tailor.log = (element: Element): LogApi => {
    const api = apis.get(element) ?? apis.get(element.querySelector(".t-log-lines") ?? element);
    if (!api) throw new Error("tailor: the element is not a log");
    return api;
  };
