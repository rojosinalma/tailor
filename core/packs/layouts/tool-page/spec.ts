import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "tool-page",
  name: "Tool page",
  pack: "layouts",
  group: "layouts",
  description:
    "A page that turns inputs into a result, to copy: a Page with mode=\"fill\" and a Split of two Panes, the inputs (a Form with a file picker, selects and a switch, its Render button in the pane footer) beside the result (a MediaFit that shows the rendered picture at the size that fits, an empty state before the first render, Download and the facts of the result). Each pane scrolls alone and the page never scrolls, whatever the size of the result. In a narrow space the panes stack, inputs above the result, each with half the height, and each still scrolls alone. Uses the pickers and forms packs. HTML kit: the form posts to its action with fetch; the page's code puts the result's <img> into the t-media-fit box, whose empty state then hides by itself.",
  root: "t-page",
  html: "markup",
});
