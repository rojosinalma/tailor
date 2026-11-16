# Usage

How a project builds a UI with tailor. The command that brings tailor into a project: [cli.md](cli.md).
Every component with its allowed values and an example in each kit: `REFERENCE.md` in the project's tailor
folder, and the showcase.

## 1. The five rules

A UI built by these rules is right in every skin and palette, on a desktop and on a phone.

1. **Pick a shell and give it data.** The shell is the frame: brand, navigation, actions, footer facts. It
   draws the current link, the phone form and the theme controls. Never write a frame by hand.
2. **Every page is a `Page`.** It has the title, the actions and the body. A page scrolls (`mode="scroll"`)
   or fills the screen and lets its panes scroll (`mode="fill"`). The frame itself never scrolls.
3. **All spacing comes from layout parts:** `Stack`, `Cluster`, `Grid`, `Section`, `Toolbar`, `Split`,
   `Pane`, `Card`. A project's own stylesheet has no margin, gap, padding or width for tailor's parts.
4. **No colours and no sizes of your own.** Colour comes from tones (`tone="danger"`) and tokens; size from
   `size="sm|md|lg"`. A value that a component does not allow is a type error in the React kit.
5. **Start from a layout.** The pack `layouts` has complete pages to copy: a list with filters, a detail
   page, a settings page, a dashboard, a form in a dialog, a first-run page.

## 2. The React kit

```sh
tailor add my-app --kit react --shell sidenav --packs forms,data
```

The command copies the stylesheets into `public/tailor/`, the kit's source into `vendor/tailor/`, prints the
lines for `<head>` and the libraries to install. The kit runs in the browser and talks to any backend.

```tsx
import { Button, Grid, Page, Stat } from "tailor/core";
import { SideNavShell } from "tailor/shell-sidenav";
import { Outlet } from "@tanstack/react-router";

// The layout route: the shell, once. It takes data, not markup.
export function AppLayout() {
  return (
    <SideNavShell
      brand={{ name: "Console", icon: "bi:box-seam" }}
      nav={[
        {
          id: "main",
          items: [
            { id: "overview", label: "Overview", icon: "bi:speedometer2", to: "/", exact: true },
            { id: "services", label: "Services", icon: "bi:hdd-stack", to: "/services", counter: 3 },
          ],
        },
      ]}
      footer={[{ id: "version", label: "Version", value: "1.4.0" }]}
    >
      <Outlet />
    </SideNavShell>
  );
}

// A page: title, actions, body. Spacing comes from the layout parts.
export function OverviewPage() {
  return (
    <Page title="Overview" primaryAction={<Button variant="primary">Deploy</Button>}>
      <Grid min="2xs">
        <Stat label="Running" value="12" tone="success" />
        <Stat label="Degraded" value="1" tone="warning" />
      </Grid>
    </Page>
  );
}
```

1. **Router.** The kit uses TanStack Router: links (`AppLink`, the shells' navigation, `ButtonLink`) go
   through it and mark the current page. The standard pages give the route helpers
   `routeNotFoundComponent`, `routeErrorComponent` and `routePendingComponent`.
2. **Theme.** The lines for `<head>` set the page's theme (`window.TAILOR_THEME`), and the kit reads it:
   `useTheme()` gives skin, palette and mode and sets them; the shells show the theme controls
   (`theme={["skin", "palette", "mode"]}`, default `["mode"]`). The choice is kept across visits. A
   `ThemeProvider` is only for a config that comes from somewhere else. Code that draws on a canvas reads
   colours from the theme and follows the `t:theme` event; the charts and the map do this by themselves.
3. **Icons.** `<Icon name="bi:house" />` comes from the project's sprite. `tailor icons` builds the sprite
   from the names in the source.
4. **Texts.** `setTexts({ close: "Schließen" })` replaces built-in texts.
5. **Data.** The pack `data` has `DataTable`, `LongList`, `TreeView`, `LogView`, and `QueryView` for the
   loading, error and empty states of a TanStack Query result. The pack `forms` has `useTailorForm` and
   `Form`, and `Settings` with rows that save by themselves.

## 3. The HTML kit

```sh
tailor add my-site --kit html --shell topnav --packs forms
```

The command copies stylesheets, scripts, the sprite and `head.html` into `public/tailor/`, and the reference
markup of every component into `public/tailor/reference/`. The server writes that markup; the script adds
behaviour. A page needs no build tool.

```html
<head>
  <!-- the content of public/tailor/head.html -->
</head>
<body>
  <!-- the markup of the shell, from public/tailor/reference/shell-topnav/topnav.html,
       with the page's own links; aria-current="page" on the current link -->
  <main class="t-shell-main" id="main" tabindex="-1">
    <div class="t-page">
      <header class="t-page-header">…<h1 class="t-page-title">Overview</h1>…</header>
      <div class="t-page-body">
        <button class="t-btn" data-variant="primary">Deploy</button>
        <select class="t-control t-select" data-t="select" name="host">…</select>
      </div>
    </div>
  </main>
</body>
```

1. **Markup.** Classes are `t-<component>` and `t-<component>-<part>`; variants are attributes
   (`data-variant`, `data-tone`, `data-size`); states are ARIA attributes. Copy the markup from the reference.
2. **Behaviour.** An element with `data-t="<name>"` gets its behaviour from the script, also when it is added
   later. A drawn control keeps the native control in the form as the value holder: it submits as usual and
   fires `input` and `change`. When the script fails, the native control still works.
3. **From code.** `Tailor.toast("success", "Saved")`, `await Tailor.confirm({ title, text, danger: true })`,
   `Tailor.theme.set({ mode: "light" })`, `Tailor.upgrade(node)`.
4. **Forms.** A `<form data-t="form" novalidate>` draws the validation messages; with
   `data-t-submit="fetch"` it sends itself and shows the answer `{ ok, message, errors }` as a toast.
5. **What the HTML kit has.** `tailor list` shows it per pack: all of it, a named part, or nothing.

## 4. Phones

1. Both kits adapt by themselves: a shell's navigation becomes a drawer (or a bottom bar with
   `phoneNav="bar"`), popups become bottom sheets, a form dialog takes the full screen, a table's rows become
   cards, controls are 44 px high on a touch screen.
2. A component adapts to the space it sits in, so a table in a narrow panel takes its narrow form on a wide
   screen too.
3. A tablet on its side is as wide as a small desktop: it gets the desktop layout, with the touch sizes.
4. The page needs the viewport line from `head.html`. Nothing else.

## 5. An installable app (the pack `pwa`)

Three levels; an app turns them on one by one.

1. **Installable.** Serve a manifest made with `buildManifest({ name, icons, themeColor, backgroundColor })`
   and an icon from `appIcon({ glyph, canvas, accent })` with the colours of the default palette. Link it:
   `<link rel="manifest" href="/manifest.webmanifest">`. React: `<PwaProvider>` at the root and
   `<PwaInstall />`, or `pwaInstallMenuItem(usePwa())` in a menu. HTML:
   `<button class="t-btn t-pwa-install" data-t="pwa-install" hidden>Install app</button>`.
2. **The frame works offline.** Serve `/sw.js` with two lines:

   ```js
   importScripts("/tailor/js/tailor-sw.js");
   tailorServiceWorker({ version: "2026-11-15-1", shell: ["/", "/tailor/css/tailor.css"], offline: "/offline.html", spa: true });
   ```

   Give a new `version` with each release of the app. React: `<PwaProvider worker="/sw.js">` with
   `<PwaUpdate />` and `<OfflineBanner />` at the top of the content, and `<NeedsNetwork>` around actions
   that need the server. HTML: `window.TAILOR_PWA = { worker: "/sw.js" }`, then
   `<div class="t-pwa-update" data-t="pwa-update" role="status"></div>`,
   `<div class="t-offline-banner" data-t="offline-banner" role="status"></div>`, and
   `data-t="needs-network"` on those actions.
3. **Data stays readable offline** (React kit). `<OfflineData client={queryClient} storageKey="my-app"
   buster={appVersion}>` in place of the Query provider.

The worker never stores a redirected answer, so a sign-in page in front of the app is never kept as the app.
There are no push notifications.

## 6. Upgrades

`tailor upgrade` shows what a new version changes and which steps a breaking change needs; `--yes` applies
it. A file that the project edited is kept, with the new version next to it as `<name>.new`.
