import { highlightedHtml, languageOf } from "@tailor/packs/code/highlight/logic";
import { register } from "../runtime";

/** Colours the plain code that the page holds. The copy button comes from the code block script. */
register("highlight", (element) => {
  const lineNumbers = element.closest(".t-highlight")?.hasAttribute("data-line-numbers") ?? false;
  element.innerHTML = highlightedHtml(element.textContent ?? "", languageOf(element.className), lineNumbers);
});
