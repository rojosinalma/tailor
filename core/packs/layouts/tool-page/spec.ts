import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "tool-page",
  name: "Tool page",
  pack: "layouts",
  group: "layouts",
  description:
    'A page that turns inputs into a result, to copy: a Page with mode="fill" and a Split of two Panes, the inputs (a Form with a file picker, selects and a switch, its Render button in the pane footer) beside the result (a MediaFit that shows the rendered picture at the size that fits, an empty state before the first render, Download and the facts of the result). Each pane scrolls alone and the page never scrolls, whatever the size of the result. On a phone the page is one column that scrolls: the inputs at their natural height with Render under them, then the result, fitted to the width and at most 70 % of the screen height. Uses the pickers and forms packs. HTML kit: the page writes no script for it: the form posts to its action with fetch and keeps Render busy, the server answers with the picture itself (image/png, a file name in Content-Disposition), tailor puts it into the t-media-fit that the form\'s data-t-result names (its empty state hides by itself) and Download (data-t-download) saves it; a JSON answer {ok: false, message} shows the failure. For facts of its own (the size, the time) the page listens to t:submit (detail.response, detail.blob). React kit: onSubmit sends the file and sets the result.',
  root: "t-page",
  html: "markup",
});
