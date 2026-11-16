import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "detail-page",
  name: "Detail page",
  pack: "layouts",
  group: "layouts",
  description:
    "The page for one record, to copy: a Page with a breadcrumb back to the list, the name as title with its state beside it (the status slot) and the image and host under it, one primary action, the others in a menu with a danger action that asks first; then a row of Stats and Tabs for the overview (Facts beside the uptime), the activity (a Timeline) and a few settings that save themselves. Uses the forms pack for the settings. HTML kit: the script answers the Restart and Delete actions by their data-id.",
  root: "t-page",
  html: "script",
});
