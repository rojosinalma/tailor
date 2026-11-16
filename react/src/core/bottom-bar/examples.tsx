import { useId } from "react";
import { defineExamples } from "../../examples";
import { NavDrawer, useNavDrawer } from "../nav-drawer/nav-drawer";
import { BRAND, FOOTER, NAV, NAV_IN_SECTION, ServicesPage } from "../shell-base/sample";
import { type NavItem, ShellBar, ShellBrandLink, ShellMain, ShellRoot } from "../shell-base/shell-base";
import { BottomBar } from "./bottom-bar";

/** A phone frame with the bar at the bottom; the drawer holds what does not fit. */
function Phone({ items }: { items: NavItem[] }) {
  const main = useId();
  const drawer = useNavDrawer();
  return (
    <ShellRoot shell="bare" mainId={main} contained>
      <ShellBar>
        <ShellBrandLink brand={BRAND} />
        <NavDrawer brand={BRAND} nav={items} footer={FOOTER} control={drawer} button={false} />
      </ShellBar>
      <ShellMain id={main}>
        <ServicesPage />
      </ShellMain>
      <BottomBar items={items} drawer={drawer} />
    </ShellRoot>
  );
}

const FIVE = NAV.filter((item) => item.id !== "system");

export default defineExamples("bottom-bar", [
  {
    id: "default",
    title: "Five items",
    display: "frame",
    width: "sm",
    render: () => <Phone items={FIVE} />,
  },
  {
    id: "more",
    title: 'More than five: four and "More", which opens the navigation drawer',
    display: "frame",
    width: "sm",
    render: () => <Phone items={NAV} />,
  },
  {
    id: "section",
    title: "The current page in a section",
    note: "A section with sub-items opens the drawer; it is marked while one of its pages is current.",
    display: "frame",
    width: "sm",
    render: () => <Phone items={NAV_IN_SECTION.slice(2)} />,
  },
]);
