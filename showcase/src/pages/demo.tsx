/** The React kit demo of a shell (demo.html?shell=<id>): the shell's sample app, with its own router. */

import { routeErrorComponent } from "@tailor/react/core/error-page/error-page";
import { IconSprite } from "@tailor/react/core/icon/icon";
import { routePendingComponent } from "@tailor/react/core/loading-page/loading-page";
import { routeNotFoundComponent } from "@tailor/react/core/not-found/not-found";
import { ThemeProvider } from "@tailor/react/core/theme-pickers/theme-pickers";
import {
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { createRoot } from "react-dom/client";
import { componentById, THEME } from "../app/data";
import type { AppContext } from "../demo/app-context";
import { AppFrame, AppPage, hasApp, NotBuilt } from "../demo/apps";
import { type AppShell, startPage } from "../demo/routes";

/** The context of the app's pages: its addresses, the page shown and a way to another page. */
function useAppContext(shell: AppShell): AppContext {
  const start = startPage(shell);
  const href = (page: string): string => (page === start ? "/" : `/${page}`);
  const navigate = useNavigate();
  // The page shown, so a link stands for its stress pages too, as in the HTML kit.
  const path = useRouterState({ select: (state) => state.location.pathname });
  return { href, current: path.slice(1) || start, go: (page) => void navigate({ to: href(page) }) };
}

function appRouter(shell: AppShell) {
  const start = startPage(shell);
  const root = createRootRoute({
    component: function Root() {
      return (
        <AppFrame shell={shell} context={useAppContext(shell)}>
          <Outlet />
        </AppFrame>
      );
    },
    notFoundComponent: routeNotFoundComponent,
  });
  const index = createRoute({
    getParentRoute: () => root,
    path: "/",
    component: function Start() {
      return <AppPage shell={shell} id={start} context={useAppContext(shell)} />;
    },
  });
  const page = createRoute({
    getParentRoute: () => root,
    path: "/$page",
    component: function Other() {
      const { page: id } = page.useParams();
      return <AppPage shell={shell} id={id} context={useAppContext(shell)} />;
    },
  });
  return createRouter({
    routeTree: root.addChildren([index, page]),
    history: createHashHistory(),
    defaultPendingComponent: routePendingComponent,
    defaultErrorComponent: routeErrorComponent,
    defaultNotFoundComponent: routeNotFoundComponent,
  });
}

const shell = new URLSearchParams(location.search).get("shell") ?? "";
const root = document.getElementById("root");
if (root) {
  document.title = `${componentById(shell)?.name ?? shell} · tailor`;
  createRoot(root).render(
    <ThemeProvider config={THEME}>
      <IconSprite href="tailor/icons.svg">
        {hasApp(shell) ? <RouterProvider router={appRouter(shell)} /> : <NotBuilt id={shell} />}
      </IconSprite>
    </ThemeProvider>,
  );
}
