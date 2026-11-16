import { register } from "../runtime";

/** Try again on the error and offline pages: the HTML kit has no callback, so it loads the page again. */
register("reload", (button) => {
  button.addEventListener("click", () => window.location.reload());
});
