/** The React kit demo of a shell (demo.html?shell=<id>): the sample console as a small app with its own router. */

import { Button } from "@tailor/react/core/button/button";
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
} from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import { createRoot } from "react-dom/client";
import { componentById, isShell, THEME } from "../app/data";
import {
  ConsoleFrame,
  ConsolePage,
  type Href,
  NotBuilt,
  ShellExampleDemo,
  SignedIn,
  SignInDemo,
} from "../demo/console";
import { EXAMPLES } from "../examples.gen";

const href: Href = (route) =>
  route.page === "overview" ? "/" : route.page === "service" ? `/services/${route.name}` : `/${route.page}`;

function consoleRouter(shell: "topnav" | "sidenav") {
  const root = createRootRoute({
    component: () => (
      <ConsoleFrame shell={shell} href={href}>
        <Outlet />
      </ConsoleFrame>
    ),
    notFoundComponent: routeNotFoundComponent,
  });
  const page = (path: string, element: () => ReactNode) =>
    createRoute({ getParentRoute: () => root, path, component: element });
  const service = createRoute({
    getParentRoute: () => root,
    path: "/services/$name",
    component: function Service() {
      const { name } = service.useParams();
      return <ConsolePage href={href} route={{ page: "service", name }} />;
    },
  });
  const tree = root.addChildren([
    page("/", () => <ConsolePage href={href} route={{ page: "overview" }} />),
    page("/services", () => <ConsolePage href={href} route={{ page: "services" }} />),
    service,
    page("/hosts", () => <ConsolePage href={href} route={{ page: "hosts" }} />),
    page("/settings", () => <ConsolePage href={href} route={{ page: "settings" }} />),
  ]);
  return createRouter({
    routeTree: tree,
    history: createHashHistory(),
    defaultPendingComponent: routePendingComponent,
    defaultErrorComponent: routeErrorComponent,
    defaultNotFoundComponent: routeNotFoundComponent,
  });
}

function BareDemo() {
  const [signedIn, setSignedIn] = useState(false);
  if (signedIn) return <SignedIn signOut={<Button onClick={() => setSignedIn(false)}>Sign out</Button>} />;
  return <SignInDemo onSignIn={() => setSignedIn(true)} />;
}

async function demoFor(id: string): Promise<ReactNode> {
  if (id === "bare") return <BareDemo />;
  if (id === "topnav" || id === "sidenav") return <RouterProvider router={consoleRouter(id)} />;
  const spec = componentById(id);
  const load = EXAMPLES[id];
  if (!spec || !isShell(spec) || !load) return <NotBuilt id={id} />;
  const { default: set } = await load();
  const example = set.examples.find((e) => e.display === "frame") ?? set.examples[0];
  return example ? <ShellExampleDemo example={example} /> : <NotBuilt id={id} />;
}

const shell = new URLSearchParams(location.search).get("shell") ?? "";
const root = document.getElementById("root");
if (root) {
  document.title = `${componentById(shell)?.name ?? shell} · tailor`;
  const demo = await demoFor(shell);
  createRoot(root).render(
    <ThemeProvider config={THEME}>
      <IconSprite href="tailor/icons.svg">{demo}</IconSprite>
    </ThemeProvider>,
  );
}
