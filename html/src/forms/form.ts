import { danger } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import { messageFor, problemOf, readResult, type SubmitResult } from "@tailor/packs/forms/form/logic";
import { busy, glyph, h, once, register, uid } from "../runtime";

type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const isControl = (element: unknown): element is Control =>
  element instanceof HTMLInputElement ||
  element instanceof HTMLSelectElement ||
  element instanceof HTMLTextAreaElement;

const FOCUSABLE =
  'input:not([type="hidden"]):not([aria-hidden="true"]), select:not([aria-hidden="true"]), textarea:not([aria-hidden="true"]), button:not([tabindex="-1"]), [tabindex="0"]';

/** Shows a toast through the core script, when the page has it. */
function toast(tone: "success" | "danger", message: string): void {
  const show = window.Tailor?.toast;
  if (typeof show === "function") show(tone, message);
}

const fieldOf = (element: Element): HTMLElement | null => element.closest<HTMLElement>(".t-field");

/**
 * The control that holds the value for an element of a field: the native control that a drawn control or an
 * editor keeps as its value holder, or the element itself.
 */
function controlOf(element: unknown): Control | null {
  if (!(element instanceof Element)) return null;
  const holder = fieldOf(element)?.querySelector("[data-t-upgraded]");
  if (isControl(holder) && holder.willValidate) return holder;
  return isControl(element) && element.willValidate ? element : null;
}

/** The element that a person sees and focuses for a control. */
const visibleOf = (control: Control): HTMLElement =>
  (control.hasAttribute("data-t-upgraded")
    ? fieldOf(control)?.querySelector<HTMLElement>(FOCUSABLE)
    : null) ?? control;

function describe(element: Element, id: string, on: boolean): void {
  const ids = new Set((element.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean));
  if (on) ids.add(id);
  else ids.delete(id);
  if (ids.size > 0) element.setAttribute("aria-describedby", [...ids].join(" "));
  else element.removeAttribute("aria-describedby");
}

/** Writes the message into the field's error text and marks the control; null clears both. */
function show(control: Control, message: string | null): void {
  const field = fieldOf(control);
  let error = field?.querySelector<HTMLElement>(".t-field-error") ?? null;
  if (!error && field && message) {
    error = h("p", { class: "t-field-error", "aria-live": "polite" });
    field.append(error);
  }
  if (error) {
    error.id ||= uid("t-error");
    error.replaceChildren(...(message ? [glyph(danger), h("span", {}, message)] : []));
  }
  for (const element of new Set([control, visibleOf(control)])) {
    if (message) element.setAttribute("aria-invalid", "true");
    else element.removeAttribute("aria-invalid");
    if (error) describe(element, error.id, message !== null);
  }
  field?.toggleAttribute("data-invalid", message !== null);
}

/** The message of the first failed check; a field can replace it with data-error-<check>. */
function messageOf(control: Control): string | null {
  if (control.validity.customError) return control.validationMessage;
  const problem = problemOf(control.validity);
  if (!problem) return null;
  const own = control.dataset[`error${problem[0]?.toUpperCase()}${problem.slice(1)}`];
  return (
    own ??
    messageFor(problem, {
      type: control.type,
      min: control instanceof HTMLInputElement ? control.min : undefined,
      max: control instanceof HTMLInputElement ? control.max : undefined,
      minLength: control instanceof HTMLSelectElement ? undefined : control.minLength,
      maxLength: control instanceof HTMLSelectElement ? undefined : control.maxLength,
    })
  );
}

function check(control: Control): boolean {
  const message = messageOf(control);
  show(control, message);
  return message === null;
}

/** The name of a field as its label shows it, without the required marker. */
function labelOf(control: Control): string {
  const label = fieldOf(control)?.querySelector(".t-field-label, legend, .t-switch-label, .t-check-label");
  if (!label) return control.name;
  const copy = label.cloneNode(true);
  if (copy instanceof Element)
    for (const marker of copy.querySelectorAll(".t-field-required")) marker.remove();
  return copy.textContent?.trim() ?? "";
}

/** What t:submit carries: the result, and for an answer that is not JSON the response and its body. */
interface SubmitDetail extends SubmitResult {
  readonly response?: Response;
  /** The body of an answer that is not JSON, such as a picture or a file. */
  readonly blob?: Blob;
}

/** The file name of an answer: from Content-Disposition, else the first chosen file's name with the type's ending. */
function fileNameOf(response: Response, blob: Blob, form: HTMLFormElement): string {
  const header = response.headers.get("content-disposition") ?? "";
  const named = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(header);
  if (named) return decodeURIComponent(named[1] ?? named[2] ?? "").trim();
  const ending = (blob.type.split("/")[1] ?? "bin").split(/[+;]/)[0];
  const chosen = [...form.querySelectorAll<HTMLInputElement>('input[type="file"]')].find((i) => i.files?.[0]);
  const base = chosen?.files?.[0]?.name.replace(/\.[^.]*$/, "") || "result";
  return `${base}.${ending}`;
}

/**
 * Puts a picture answer into the MediaFit that the form names with data-t-result, in place of the one before,
 * and enables the buttons that download it (data-t-download="<the MediaFit's id>").
 */
function showResult(form: HTMLFormElement, blob: Blob, name: string): void {
  const box = document.getElementById(form.dataset.tResult ?? "");
  if (!box || !blob.type.startsWith("image/")) return;
  const old = box.querySelector<HTMLImageElement>(":scope > img");
  if (old?.src.startsWith("blob:")) URL.revokeObjectURL(old.src);
  const file = [...form.querySelectorAll<HTMLInputElement>('input[type="file"]')]
    .map((input) => input.files?.[0]?.name)
    .find(Boolean);
  const alt = (form.dataset.tResultAlt ?? t("formResult")).replace("{file}", file ?? name);
  const img = h("img", { src: URL.createObjectURL(blob), alt });
  if (old) old.replaceWith(img);
  else box.prepend(img);
  box.dataset.tFile = name;
  for (const button of document.querySelectorAll<HTMLButtonElement>(`[data-t-download="${box.id}"]`)) {
    button.disabled = false;
    button.removeAttribute("aria-disabled");
  }
}

/** A button with data-t-download="<id>" saves the picture in that MediaFit, under the name of the answer. */
once("download", () => {
  document.addEventListener("click", (event) => {
    const button = event.target instanceof Element ? event.target.closest("[data-t-download]") : null;
    const box = document.getElementById(button?.getAttribute("data-t-download") ?? "");
    const img = box?.querySelector<HTMLImageElement>(":scope > img, :scope > picture > img");
    if (!box || !img?.src) return;
    const link = h("a", { href: img.src, download: box.dataset.tFile ?? "" });
    link.click();
  });
});

/**
 * A form that checks its fields with the native rules and draws the errors into the tailor fields.
 * With data-t-submit="fetch" it sends itself with fetch, keeps its submit button busy, shows a JSON outcome as
 * a toast, and fires t:submit with the result. An answer that is not JSON (a picture, a file) goes to the page
 * as detail.blob; a picture goes into the MediaFit that data-t-result names.
 */
register("form", (element) => {
  if (!(element instanceof HTMLFormElement)) return;
  const form = element;
  form.noValidate = true;
  const summary = form.querySelector<HTMLElement>(".t-form-summary");
  let failed = false;
  let sending = false;
  let shown = "";

  const controls = (): Control[] => {
    const seen = new Set<string>();
    const out: Control[] = [];
    for (const item of form.elements) {
      const control = controlOf(item);
      if (!control || out.includes(control)) continue;
      if (control instanceof HTMLInputElement && control.type === "radio") {
        if (seen.has(control.name)) continue;
        seen.add(control.name);
      }
      out.push(control);
    }
    return out;
  };

  const refresh = (): void => {
    if (!summary) return;
    const invalid = failed ? controls().filter((c) => fieldOf(c)?.hasAttribute("data-invalid")) : [];
    // The same errors keep the same links, so that a click on a link is not lost to a redraw.
    const key = invalid.map((c) => `${c.name}:${messageOf(c)}`).join("\n");
    if (key === shown) return;
    shown = key;
    summary.hidden = invalid.length === 0;
    if (invalid.length === 0) {
      summary.replaceChildren();
      return;
    }
    const links = invalid.map((control) => {
      const target = visibleOf(control);
      target.id ||= uid("t-control");
      const link = h("a", { href: `#${target.id}` }, `${labelOf(control)}: ${messageOf(control) ?? ""}`);
      link.addEventListener("click", (event) => {
        event.preventDefault();
        target.focus();
      });
      return h("li", {}, link);
    });
    summary.replaceChildren(
      h(
        "div",
        { class: "t-alert", "data-tone": "danger", role: "alert" },
        h("span", { class: "t-alert-icon" }, glyph(danger)),
        h(
          "div",
          { class: "t-alert-content" },
          h("p", { class: "t-alert-title" }, t("formSummary")),
          h("div", { class: "t-alert-text" }, h("ul", { class: "t-form-summary-list" }, ...links)),
        ),
      ),
    );
  };

  /** Checks every field; on a failure shows the summary and focuses the first invalid field. */
  const checkAll = (): boolean => {
    let first: Control | null = null;
    for (const control of controls()) if (!check(control) && !first) first = control;
    if (!first) return true;
    failed = true;
    refresh();
    visibleOf(first).focus();
    return false;
  };

  const send = async (submitter: HTMLButtonElement | null): Promise<void> => {
    sending = true;
    busy(submitter, true);
    let result: SubmitDetail;
    try {
      const method = (form.getAttribute("method") ?? "post").toUpperCase();
      const url = new URL(form.getAttribute("action") ?? location.href, location.href);
      const data = new FormData(form, submitter);
      // The page can show what is sent ("Rendering plan.svg") and add fields; t:submit tells the outcome.
      form.dispatchEvent(new CustomEvent("t:send", { detail: { data }, bubbles: true }));
      const init: RequestInit = { method, headers: { Accept: "application/json, */*;q=0.8" } };
      if (method === "GET") for (const [name, value] of data) url.searchParams.append(name, String(value));
      else init.body = data;
      const response = await fetch(url, init);
      const type = response.headers.get("content-type") ?? "";
      if (type === "" || /[/+]json\b/.test(type)) {
        result = { ...readResult(await response.json()), response };
      } else if (response.ok) {
        const blob = await response.blob();
        result = { ok: true, response, blob };
        showResult(form, blob, fileNameOf(response, blob, form));
      } else {
        // A plain-text failure is the server's message; a page of HTML is not shown.
        const text = type.startsWith("text/plain") ? (await response.text()).trim().slice(0, 300) : "";
        result = { ok: false, message: text || undefined, response };
      }
    } catch {
      result = { ok: false, message: t("formNotSent") };
    }
    sending = false;
    busy(submitter, false);
    if (result.ok) {
      failed = false;
      refresh();
      // A picture or a file shows itself; a JSON answer says what happened.
      if (!result.blob) toast("success", result.message ?? t("formSaved"));
    } else {
      toast("danger", result.message ?? t("formFailed"));
      for (const [name, message] of Object.entries(result.errors ?? {})) {
        const item = form.elements.namedItem(name);
        const control = controlOf(item instanceof RadioNodeList ? item[0] : item);
        if (!control) continue;
        control.setCustomValidity(message);
        check(control);
      }
      checkAll();
    }
    form.dispatchEvent(new CustomEvent("t:submit", { detail: result, bubbles: true }));
  };

  form.addEventListener("focusout", (event) => {
    const control = controlOf(event.target);
    if (!control) return;
    // A move inside the field or into its popup is no blur; nor a press on a submit button, which checks
    // anyway: an error drawn now would move the button away from the click.
    const to = event.relatedTarget;
    if (to instanceof Element && (fieldOf(control)?.contains(to) || to.closest(".t-popup-positioner")))
      return;
    if (to instanceof HTMLButtonElement && to.type === "submit" && to.matches(":active")) return;
    check(control);
    refresh();
  });

  const changed = (event: Event): void => {
    const control = controlOf(event.target);
    if (!control) return;
    if (control.validity.customError) control.setCustomValidity("");
    if (!fieldOf(control)?.hasAttribute("data-invalid")) return;
    check(control);
    refresh();
  };
  form.addEventListener("input", changed);
  form.addEventListener("change", changed);

  form.addEventListener("submit", (event) => {
    if (sending || !checkAll()) {
      event.preventDefault();
      return;
    }
    if (form.dataset.tSubmit !== "fetch") return;
    event.preventDefault();
    const submitter = event.submitter instanceof HTMLButtonElement ? event.submitter : null;
    // The submit button may sit outside the form (form="<id>"), such as in a dialog footer.
    const first = [...form.elements].find(
      (item): item is HTMLButtonElement => item instanceof HTMLButtonElement && item.type === "submit",
    );
    void send(submitter ?? first ?? null);
  });

  // A drawn trigger that shows a value is named by its label and its value, so that its name holds what it
  // shows. The core select and date scripts name it by the label only.
  const name = (): void => {
    for (const value of form.querySelectorAll(
      ".t-select-trigger > .t-select-value, .t-date-trigger > .t-date-value",
    )) {
      const trigger = value.parentElement;
      const label = trigger?.getAttribute("aria-labelledby");
      if (!trigger || !label || label.includes(" ")) continue;
      value.id ||= uid("t-value");
      trigger.setAttribute("aria-labelledby", `${label} ${value.id}`);
    }
  };
  name();
  requestAnimationFrame(name);

  form.addEventListener("reset", () => {
    failed = false;
    requestAnimationFrame(() => {
      for (const control of controls()) {
        control.setCustomValidity("");
        show(control, null);
      }
      refresh();
    });
  });
});
