import { useId } from "react";
import { defineExamples } from "../../examples";
import { Stack } from "../stack/stack";
import { ACTIONS, BRAND, FOOTER, GROUPS, NAV_IN_SECTION, SEARCH, ServicesPage } from "./sample";
import {
  FooterFacts,
  NavLists,
  ShellActions,
  ShellBar,
  ShellBrandLink,
  ShellFooter,
  ShellMain,
  ShellRoot,
  ShellSearch,
  ShellSearchButton,
  useShellSearch,
} from "./shell-base";

function Frame() {
  const main = useId();
  const search = useShellSearch();
  return (
    <ShellRoot shell="bare" mainId={main} contained>
      <ShellBar>
        <ShellBrandLink brand={BRAND} />
        <ShellSearch control={search}>{SEARCH}</ShellSearch>
        <ShellSearchButton control={search} />
        <ShellActions>{ACTIONS}</ShellActions>
      </ShellBar>
      <ShellMain id={main}>
        <ServicesPage />
      </ShellMain>
      <ShellFooter facts={FOOTER} theme={["palette", "mode"]} />
    </ShellRoot>
  );
}

export default defineExamples("shell-base", [
  {
    id: "frame",
    title: "The parts of a frame: bar, brand, search, actions, main region, footer",
    note: "Shells put these parts together; an app picks a shell instead. Tab once to see the skip link. In a narrow frame the search folds into its button.",
    display: "frame",
    render: () => <Frame />,
  },
  {
    id: "links",
    title: "Links in groups: icons, a counter, the current page, a section with the current page",
    width: "sm",
    render: () => <NavLists nav={GROUPS} path={null} label="Sample navigation" />,
  },
  {
    id: "sections",
    title: "Sub-items indented under their section; an item without an icon shows its first letter",
    width: "sm",
    render: () => (
      <NavLists
        nav={[...NAV_IN_SECTION, { id: "audit", label: "Audit log", to: "#audit" }]}
        path={null}
        label="Sample navigation with sections"
      />
    ),
  },
  {
    id: "facts",
    title: "Brand and footer facts",
    render: () => (
      <Stack>
        <ShellBrandLink brand={BRAND} />
        <FooterFacts facts={FOOTER} />
      </Stack>
    ),
  },
]);
