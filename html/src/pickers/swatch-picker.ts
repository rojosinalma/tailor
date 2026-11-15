import { register } from "../runtime";
import { fieldGroup } from "./date";

/** The swatches are plain radios; the script only takes the label of a Field around them. */
register("swatches", (group) => {
  fieldGroup(
    group,
    () =>
      group.querySelector<HTMLElement>("input:checked") ?? group.querySelector<HTMLElement>("input:enabled"),
  );
});
