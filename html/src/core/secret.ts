import { check, copy, eye, eyeSlash } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import { glyph, h, register } from "../runtime";

const COPIED_FOR = 2000;

/** Adds the reveal button and, when asked for, the copy button to a secret field. */
register("secret", (root) => {
  const input = root.querySelector<HTMLInputElement>("input.t-input-native");
  if (!input) return;

  const reveal = h(
    "button",
    {
      type: "button",
      class: "t-input-action t-secret-reveal",
      "aria-label": t("show"),
      "aria-pressed": "false",
      disabled: input.disabled,
    },
    glyph(eye),
  );
  reveal.addEventListener("click", () => {
    const shown = input.type === "password";
    input.type = shown ? "text" : "password";
    reveal.setAttribute("aria-pressed", String(shown));
    reveal.replaceChildren(glyph(shown ? eyeSlash : eye));
  });
  root.append(reveal);

  if (!root.hasAttribute("data-copyable")) return;
  const button = h(
    "button",
    {
      type: "button",
      class: "t-input-action t-secret-copy",
      "aria-label": t("copy"),
      disabled: input.disabled,
    },
    glyph(copy),
  );
  let timer = 0;
  const show = (copied: boolean): void => {
    button.toggleAttribute("data-copied", copied);
    button.setAttribute("aria-label", t(copied ? "copied" : "copy"));
    button.replaceChildren(glyph(copied ? check : copy));
  };
  button.addEventListener("click", () => {
    navigator.clipboard.writeText(input.value).then(
      () => {
        show(true);
        clearTimeout(timer);
        timer = window.setTimeout(() => show(false), COPIED_FOR);
      },
      () => show(false),
    );
  });
  root.append(button);
});
