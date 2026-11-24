import { check, danger, retry } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import { activeIndex, SAVED_FOR, saveOutcome, TEXT_DELAY } from "@tailor/packs/forms/settings/logic";
import { glyph, h, register } from "../runtime";

function scrollerOf(element: HTMLElement): HTMLElement {
  for (let box: HTMLElement | null = element; box; box = box.parentElement) {
    const { overflowY } = getComputedStyle(box);
    if ((overflowY === "auto" || overflowY === "scroll") && box.scrollHeight > box.clientHeight) return box;
  }
  return document.scrollingElement instanceof HTMLElement ? document.scrollingElement : document.body;
}

/** Marks the link of the section in view; a click on a link scrolls to its section without a jump in history. */
register("settings", (root) => {
  const nav = root.querySelector(".t-settings-nav");
  const content = root.querySelector<HTMLElement>(".t-settings-content");
  if (!nav || !content) return;
  const links = [...nav.querySelectorAll<HTMLAnchorElement>(".t-settings-link")];
  const sections = [...content.querySelectorAll<HTMLElement>(".t-settings-section")];

  const mark = (index: number): void => {
    if (index < 0) return;
    links.forEach((link, i) => {
      if (i === index) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  };
  const measure = (): void => {
    const scroller = scrollerOf(content);
    const box = scroller === document.scrollingElement ? 0 : scroller.getBoundingClientRect().top;
    const navBox = nav.getBoundingClientRect();
    const stacked = navBox.right > content.getBoundingClientRect().left + 1;
    const line = Math.max(box, stacked ? navBox.bottom : box) + 16;
    const atEnd =
      scroller.scrollTop > 0 && scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2;
    mark(
      activeIndex(
        sections.map((s) => s.getBoundingClientRect().top),
        line,
        atEnd,
      ),
    );
  };
  document.addEventListener(
    "scroll",
    (event) => {
      if (event.target instanceof Node && (event.target.contains(root) || root.contains(event.target)))
        measure();
      else if (event.target === document) measure();
    },
    { capture: true, passive: true },
  );
  links.forEach((link, index) => {
    link.addEventListener("click", (event) => {
      const section = sections[index];
      if (!section) return;
      event.preventDefault();
      section.scrollIntoView({ block: "start" });
      section.querySelector<HTMLElement>(".t-settings-section-title")?.focus({ preventScroll: true });
      mark(index);
    });
  });
});

type Value = string | number | boolean | null;

/** Saves the control of a setting row on each change, shows the state and puts the old value back on a failure. */
register("setting", (row) => {
  const url = row.dataset.saveUrl;
  const state = row.querySelector<HTMLElement>(".t-setting-state");
  const control =
    row.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("[data-t-upgraded]") ??
    row.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      ".t-field-control input:not([type='hidden']), .t-field-control select, .t-field-control textarea",
    );
  if (!url || !state || !control) return;
  const method = row.dataset.saveMethod ?? "PATCH";
  const toggle =
    control instanceof HTMLInputElement && (control.type === "checkbox" || control.type === "radio");
  const text =
    control instanceof HTMLTextAreaElement ||
    (control instanceof HTMLInputElement &&
      ["text", "search", "email", "url", "password", "tel"].includes(control.type));

  const read = (): Value => {
    if (toggle && control instanceof HTMLInputElement) return control.checked;
    if (control instanceof HTMLInputElement && control.type === "number")
      return control.value === "" ? null : control.valueAsNumber;
    return control.value;
  };
  let quiet = false;
  const write = (value: Value): void => {
    quiet = true;
    if (toggle && control instanceof HTMLInputElement) control.checked = value === true;
    else control.value = value === null ? "" : String(value);
    control.dispatchEvent(new Event("input", { bubbles: true }));
    control.dispatchEvent(new Event("change", { bubbles: true }));
    quiet = false;
  };

  let saved = read();
  let sent = saved;
  let failed: Value = saved;
  let round = 0;
  let fade = 0;
  const show = (now: "saving" | "saved" | "failed" | "idle"): void => {
    clearTimeout(fade);
    if (now === "idle") state.removeAttribute("data-state");
    else state.setAttribute("data-state", now);
    if (now === "saving")
      state.replaceChildren(
        h("span", { class: "t-spinner", "data-size": "sm", "aria-hidden": "true" }),
        h("span", { class: "t-sr-only" }, t("settingSaving")),
      );
    else if (now === "saved") {
      state.replaceChildren(glyph(check), h("span", { class: "t-sr-only" }, t("settingSaved")));
      fade = window.setTimeout(() => show("idle"), SAVED_FOR);
    } else if (now === "failed") {
      const again = h(
        "button",
        {
          type: "button",
          class: "t-btn",
          "data-variant": "ghost",
          "data-size": "sm",
          "data-icon-only": "",
          "aria-label": t("retry"),
        },
        glyph(retry),
      );
      again.addEventListener("click", () => {
        write(failed);
        void send(failed);
      });
      state.replaceChildren(glyph(danger), h("span", {}, t("settingNotSaved")), again);
    } else state.replaceChildren();
  };

  const send = async (value: Value): Promise<void> => {
    const mine = ++round;
    sent = value;
    show("saving");
    let outcome: { ok: boolean; message?: string };
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name: control.name, value }),
      });
      // An empty answer (204 No Content) is saved when the status says so; a JSON answer says it itself.
      const body = (await response.text()).trim();
      outcome = body === "" ? { ok: response.ok } : saveOutcome(JSON.parse(body));
      if (!response.ok && outcome.ok) outcome = { ok: false, message: outcome.message };
    } catch {
      outcome = { ok: false };
    }
    if (mine !== round) return;
    if (outcome.ok) {
      saved = value;
      show("saved");
    } else {
      failed = value;
      sent = saved;
      write(saved);
      show("failed");
      const toast = window.Tailor?.toast;
      if (typeof toast === "function") toast("danger", outcome.message ?? t("settingFailed"));
    }
    row.dispatchEvent(
      new CustomEvent("t:save", { detail: { ...outcome, name: control.name, value }, bubbles: true }),
    );
  };

  let timer = 0;
  control.addEventListener("input", () => {
    if (quiet || !text) return;
    clearTimeout(timer);
    timer = window.setTimeout(() => void send(read()), TEXT_DELAY);
  });
  control.addEventListener("change", () => {
    if (quiet) return;
    clearTimeout(timer);
    const value = read();
    if (value !== sent || state.dataset.state === "failed") void send(value);
  });
});
