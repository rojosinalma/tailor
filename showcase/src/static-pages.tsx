/** The HTML kit's demo of each shell: the shell's sample app as static pages that link to each other. */

import type { StaticPage } from "../../bin/lib/build-showcase";
import { SHELLS } from "./app/data";
import type { AppContext } from "./demo/app-context";
import { AppFrame, AppPage, hasApp, NotBuilt } from "./demo/apps";
import { appPages, htmlAddress } from "./demo/routes";

/** The addresses of the HTML kit's demo pages, next to each other in one folder. */
const staticHref = (page: string): string => `${page}.html`;

function pagesOf(shell: string, name: string): StaticPage[] {
  if (!hasApp(shell))
    return [{ path: `html/demo/${shell}/index.html`, title: name, render: () => <NotBuilt id={shell} /> }];
  return appPages(shell).map((page) => {
    const context: AppContext = { href: staticHref, current: page.id };
    return {
      path: htmlAddress(page),
      title: `${page.title} · ${name}`,
      render: () => (
        <AppFrame shell={shell} context={context}>
          <AppPage shell={shell} id={page.id} context={context} />
        </AppFrame>
      ),
    };
  });
}

export const staticPages: StaticPage[] = SHELLS.filter((s) => s.html !== "none").flatMap((s) =>
  pagesOf(s.id, s.name),
);
