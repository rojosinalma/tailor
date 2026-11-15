import { check, copy } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import { glyph, register } from "../runtime";

/** How long the copy button shows its check. */
const COPIED_MS = 2000;

/** Makes the copy button of a code block copy the code. */
register("code-block", (element) => {
  const button = element.querySelector<HTMLButtonElement>(".t-code-copy");
  const code = element.querySelector(".t-code-pre code");
  const label = button?.querySelector(".t-btn-label");
  if (!button || !code || !label) return;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const show = (copied: boolean): void => {
    button.querySelector(".t-icon")?.replaceWith(glyph(copied ? check : copy));
    button.toggleAttribute("data-copied", copied);
    label.textContent = t(copied ? "copied" : "copy");
  };
  button.addEventListener("click", () => {
    navigator.clipboard.writeText(code.textContent ?? "").then(
      () => {
        show(true);
        clearTimeout(timer);
        timer = setTimeout(() => show(false), COPIED_MS);
      },
      // Without clipboard access the button stays as it is.
      () => undefined,
    );
  });
});
