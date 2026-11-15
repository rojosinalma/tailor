import { register } from "../runtime";

/** A mixed state is a property of a native checkbox, so markup alone cannot set it. */
register("check", (element) => {
  if (element instanceof HTMLInputElement && element.hasAttribute("data-indeterminate"))
    element.indeterminate = true;
});
