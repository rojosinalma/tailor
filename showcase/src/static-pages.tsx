/** The HTML kit's demo of each shell: the sample console as separate static pages that link to each other. */

import { ButtonLink } from "@tailor/react/core/button/button";
import type { StaticPage } from "../../bin/lib/build-showcase";
import { SHELLS } from "./app/data";
import {
  ConsoleFrame,
  ConsolePage,
  type DemoRoute,
  NotBuilt,
  SERVICES,
  ShellExampleDemo,
  SignedIn,
  SignInDemo,
  staticHref,
} from "./demo/console";
import { EXAMPLES } from "./examples.gen";

const CONSOLE_ROUTES: readonly DemoRoute[] = [
  { page: "overview" },
  { page: "services" },
  ...SERVICES.map((s): DemoRoute => ({ page: "service", name: s.name })),
  { page: "hosts" },
  { page: "settings" },
  { page: "reports" },
];

const TITLES: Record<DemoRoute["page"], string> = {
  overview: "Overview",
  services: "Services",
  service: "Service",
  hosts: "Hosts",
  settings: "Settings",
  reports: "Not found",
};

async function pagesOf(shell: string, name: string): Promise<StaticPage[]> {
  const at = (file: string): string => `html/demo/${shell}/${file}`;
  if (shell === "topnav" || shell === "sidenav")
    return CONSOLE_ROUTES.map((route) => ({
      path: at(staticHref(route)),
      title: `${route.page === "service" ? route.name : TITLES[route.page]} · ${name}`,
      render: () => (
        <ConsoleFrame shell={shell} href={staticHref} current={route.page}>
          <ConsolePage route={route} href={staticHref} />
        </ConsoleFrame>
      ),
    }));
  if (shell === "bare")
    return [
      {
        path: at("sign-in.html"),
        title: `Sign in · ${name}`,
        render: () => <SignInDemo action="signed-in.html" />,
      },
      {
        path: at("signed-in.html"),
        title: `Signed in · ${name}`,
        render: () => <SignedIn signOut={<ButtonLink to="sign-in.html">Sign out</ButtonLink>} />,
      },
    ];
  const load = EXAMPLES[shell];
  const example = load ? (await load()).default.examples.find((e) => e.display === "frame") : undefined;
  return [
    {
      path: at("overview.html"),
      title: name,
      render: () => (example ? <ShellExampleDemo example={example} /> : <NotBuilt id={shell} />),
    },
  ];
}

export const staticPages: StaticPage[] = (
  await Promise.all(SHELLS.filter((s) => s.html !== "none").map((s) => pagesOf(s.id, s.name)))
).flat();
