import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "dashboard-page",
  name: "Dashboard page",
  pack: "layouts",
  group: "layouts",
  description:
    "An overview, to copy: a Page with an Alert for the one thing that needs attention, a row of Stats with small charts, and cards in two columns that become one when narrow: a line chart of the requests (charts pack), the hosts with their state, the latest deploys and the backups. Uses the charts pack.",
  root: "t-page",
  html: "markup",
});
