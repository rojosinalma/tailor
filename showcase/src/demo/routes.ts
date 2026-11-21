/**
 * The pages of the sample apps, one app per shell: plain data, so the checks can list them without React.
 * Together the apps use every layout of the layouts pack. A stress page holds hostile content (long text,
 * names with no break, many rows, large media) or a state (empty, loading, error) of a page beside it.
 */

export type AppShell = "topnav" | "sidenav" | "workspace" | "bare";

export interface AppPage {
  readonly shell: AppShell;
  /** The address of the page in its app: a router path in the React kit, a file name in the HTML kit. */
  readonly id: string;
  readonly title: string;
  /** What the page shows, for the list on the shell's page of the showcase. */
  readonly about: string;
  readonly stress?: boolean;
}

const page = (shell: AppShell, id: string, title: string, about: string, stress = false): AppPage => ({
  shell,
  id,
  title,
  about,
  stress,
});

export const APP_PAGES: readonly AppPage[] = [
  // topnav: a tool that renders a drawing to a picture.
  page("topnav", "render", "Render", "Tool page: settings beside the preview"),
  page("topnav", "settings", "Settings", "Settings page"),
  page("topnav", "render-large", "Render", "A 6000 × 4000 picture with a long file name", true),
  page("topnav", "render-tall", "Render", "A picture taller than the screen", true),
  page("topnav", "render-busy", "Render", "A render that runs", true),
  page("topnav", "render-failed", "Render", "A render that failed, with a long message", true),
  // sidenav: a service console.
  page("sidenav", "overview", "Overview", "Dashboard page"),
  page("sidenav", "services", "Services", "List page"),
  page("sidenav", "service", "api", "Detail page"),
  page("sidenav", "hosts", "Hosts", "Cards in a grid"),
  page("sidenav", "add", "Services", "Form dialog: the page and its button"),
  page("sidenav", "settings", "Settings", "Settings page"),
  page("sidenav", "reports", "Not found", "A link to a page that does not exist"),
  page("sidenav", "services-many", "Services", "300 rows, names and images with no break", true),
  page("sidenav", "services-empty", "Services", "No services", true),
  page("sidenav", "services-loading", "Services", "The list on its way", true),
  page("sidenav", "services-error", "Services", "The list did not load", true),
  page("sidenav", "service-long", "Service", "A record with long names and no break", true),
  page("sidenav", "overview-loading", "Overview", "The page on its way", true),
  page("sidenav", "overview-error", "Overview", "The page did not load, with long details", true),
  // workspace: a file editor with an output panel.
  page("workspace", "editor", "compose.yaml", "A file in the centre, the output below"),
  page("workspace", "editor-long", "compose.yaml", "2,000 lines, long lines and a long output", true),
  // bare: the pages before and outside the app.
  page("bare", "sign-in", "Sign in", "Sign-in page"),
  page("bare", "first-run", "Services", "First-run page"),
  page("bare", "error", "Error", "Error page"),
  page("bare", "offline", "Offline", "Offline page"),
  page("bare", "error-long", "Error", "An error with long details and no break", true),
  page("bare", "error-details", "Error", "The same error with its details open", true),
];

export const appPages = (shell: string): readonly AppPage[] => APP_PAGES.filter((p) => p.shell === shell);

/** The first page of an app: the page its address opens. */
export const startPage = (shell: string): string => appPages(shell)[0]?.id ?? "";

/** The React kit's address of a page, relative to the site root. */
export const reactAddress = (p: { shell: string; id: string }): string =>
  `demo.html?shell=${p.shell}#/${p.id === startPage(p.shell) ? "" : p.id}`;

/** The HTML kit's address of a page, relative to the site root. */
export const htmlAddress = (p: { shell: string; id: string }): string => `html/demo/${p.shell}/${p.id}.html`;
