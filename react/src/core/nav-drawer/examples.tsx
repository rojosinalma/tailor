import { useId } from "react";
import { defineExamples } from "../../examples";
import { ACTIONS, BRAND, FOOTER, GROUPS, NAV, NAV_IN_SECTION, ServicesPage } from "../shell-base/sample";
import { ShellBar, ShellBrandLink, ShellMain, ShellRoot } from "../shell-base/shell-base";
import { NavDrawer, type NavDrawerProps } from "./nav-drawer";

/** A phone frame: the menu button and the brand in a bar, a page under it. */
function Phone(props: NavDrawerProps) {
  const main = useId();
  return (
    <ShellRoot shell="bare" mainId={main} contained>
      <ShellBar>
        <NavDrawer {...props} />
        <ShellBrandLink brand={props.brand} />
      </ShellBar>
      <ShellMain id={main}>
        <ServicesPage />
      </ShellMain>
    </ShellRoot>
  );
}

export default defineExamples("nav-drawer", [
  {
    id: "default",
    title: "Groups, footer facts and the theme controls",
    note: "The menu button opens it; a link, Escape, the backdrop or a swipe toward the start edge closes it.",
    display: "frame",
    width: "sm",
    render: () => <Phone brand={BRAND} nav={GROUPS} footer={FOOTER} theme={["palette", "mode"]} />,
  },
  {
    id: "sections",
    title: "A plain list, the current page in a section, global actions",
    display: "frame",
    width: "sm",
    render: () => <Phone brand={BRAND} nav={NAV_IN_SECTION} actions={ACTIONS} footer={FOOTER} />,
  },
  {
    id: "plain",
    title: "No footer, no theme controls",
    display: "frame",
    width: "sm",
    render: () => <Phone brand={{ name: "nas" }} nav={NAV} theme={false} />,
  },
]);
