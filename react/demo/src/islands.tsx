// Showcase islands for the Primer kit: component id → the React element the kit bundle renders into that
// component's `.sc-demo` box when the showcase's Kit picker says "primer". Every island uses the Primer Ui
// surface (react/adapters/primer), so the same Ui.* calls that give tailor markup on the CSS path give Primer
// here; components the adapter does not map render the CSS path (core only — the skin is off under a kit).
//
// Base: the parity fixtures over the Primer Ui (same content as the canonical markup). Overrides below replace
// the fixtures that are placeholders ("…") or that need state the HTML demo gets from tailor.js (dialog,
// confirm, toast). Tier-2 components have no Ui.* counterpart yet and keep their HTML demo.
import { useState, type ReactNode } from "react";
import { Ui, useToasts } from "../../adapters/primer/index.tsx";
import { makeFixtures } from "../../parity/fixtures.tsx";
import type { UiComponents } from "../../src/index.ts";

function DialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <Ui.Cluster gap="2">
      <Ui.Button size="sm" onClick={() => setOpen(true)}>Edit dialog</Ui.Button>
      <Ui.Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Edit service"
        footer={
          <>
            <Ui.Button onClick={() => setOpen(false)}>Cancel</Ui.Button>
            <Ui.Button variant="primary" onClick={() => setOpen(false)}>Save</Ui.Button>
          </>
        }
      >
        <Ui.Field label="Subdomain" id="k-d-sub">
          <Ui.Input defaultValue="render" />
        </Ui.Field>
      </Ui.Dialog>
    </Ui.Cluster>
  );
}

function ConfirmDemo() {
  const { toast } = useToasts();
  const [which, setWhich] = useState<"danger" | "neutral" | null>(null);
  return (
    <Ui.Cluster gap="2">
      <Ui.Button size="sm" variant="danger" onClick={() => setWhich("danger")}>Delete…</Ui.Button>
      <Ui.Button size="sm" onClick={() => setWhich("neutral")}>Reboot… (neutral)</Ui.Button>
      <Ui.Confirm
        open={which !== null}
        title={which === "danger" ? "Delete service?" : "Reboot epaper-display?"}
        label={which === "danger" ? "Delete" : "Reboot"}
        danger={which === "danger"}
        onResult={(ok) => { setWhich(null); toast(ok ? "success" : "info", ok ? (which === "danger" ? "render deleted" : "Reboot sent") : "Cancelled"); }}
      >
        {which === "danger"
          ? <>Removes the container, folder, DNS route and health check for <code>render</code>. This cannot be undone.</>
          : "The screen goes blank for about 20 seconds."}
      </Ui.Confirm>
    </Ui.Cluster>
  );
}

function ToastDemo() {
  const { toast } = useToasts();
  const messages = { success: "Saved and synced to health checks", warning: "Saved, DNS sync pending", danger: "DNS provider rejected the record: quota exceeded", info: "Next sync in 30 minutes" } as const;
  return (
    <Ui.Cluster gap="2">
      <Ui.Button size="sm" tone="success" onClick={() => toast("success", messages.success)}>Success</Ui.Button>
      <Ui.Button size="sm" variant="warning" onClick={() => toast("warning", messages.warning)}>Warning</Ui.Button>
      <Ui.Button size="sm" variant="danger" onClick={() => toast("danger", messages.danger)}>Error</Ui.Button>
      <Ui.Button size="sm" onClick={() => toast("info", messages.info)}>Info</Ui.Button>
    </Ui.Cluster>
  );
}

// Image avatars need a real src (the parity fixture uses a placeholder): a flat SVG disc, inline.
const avatarSrc = (fill: string) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="${fill}"/><circle cx="16" cy="12" r="6" fill="#fff" opacity=".9"/><path d="M4 30a12 9 0 0 1 24 0z" fill="#fff" opacity=".9"/></svg>`)}`;

const overrides: Record<string, ReactNode> = {
  avatar: (
    <Ui.Cluster gap="2" align="center">
      <Ui.Avatar tone="purple">AL</Ui.Avatar>
      <Ui.Avatar size="lg" src={avatarSrc("#6272a4")} />
      <Ui.Avatar tone="cyan" status="online">TM</Ui.Avatar>
      <Ui.Avatar.Stack>
        <Ui.Avatar src={avatarSrc("#8be9fd")} />
        <Ui.Avatar src={avatarSrc("#50fa7b")} />
        <Ui.Avatar more>+3</Ui.Avatar>
      </Ui.Avatar.Stack>
      <Ui.Avatar.Row name="alice" desc="owner"><Ui.Avatar src={avatarSrc("#bd93f9")} /></Ui.Avatar.Row>
    </Ui.Cluster>
  ),
  dialog: <DialogDemo />,
  confirm: <ConfirmDemo />,
  toast: <ToastDemo />,
  page: (
    <Ui.Page style={{ padding: 0 }}>
      <Ui.Page.Header>
        <Ui.Page.Back href="#page" aria-label="Back" />
        <Ui.Page.Title>render</Ui.Page.Title>
        <Ui.Page.Lead>console service · web-1</Ui.Page.Lead>
        <Ui.Page.Actions><Ui.Button variant="secondary">Logs</Ui.Button><Ui.Button variant="primary">Deploy</Ui.Button></Ui.Page.Actions>
      </Ui.Page.Header>
    </Ui.Page>
  ),
  "app-shell": (
    <div className="t-demo-shell">
      <Ui.AppShell
        nav={<Ui.Navbar><Ui.Navbar.Brand href="#">console</Ui.Navbar.Brand><Ui.Navbar.Nav><Ui.Navbar.Link href="#" current>Services</Ui.Navbar.Link><Ui.Navbar.Link href="#">Hosts</Ui.Navbar.Link></Ui.Navbar.Nav></Ui.Navbar>}
        side={<Ui.Sidebar label="Mock"><Ui.Sidebar.Group>Fleet</Ui.Sidebar.Group><Ui.Sidebar.Item href="#" current>Overview</Ui.Sidebar.Item><Ui.Sidebar.Item href="#" trail={<Ui.Counter>12</Ui.Counter>}>Devices</Ui.Sidebar.Item></Ui.Sidebar>}
        foot={<Ui.Footer><Ui.Footer.End><Ui.Footer.Version>v0.9.2</Ui.Footer.Version></Ui.Footer.End></Ui.Footer>}
      >
        <Ui.Page.Header><Ui.Page.Title>Services</Ui.Page.Title></Ui.Page.Header>
        <p className="t-muted">Main column scrolls; sidebar and navbar stay.</p>
      </Ui.AppShell>
    </div>
  ),
  navbar: (
    <Ui.Navbar>
      <Ui.Navbar.Brand href="/">console</Ui.Navbar.Brand>
      <Ui.Navbar.Nav><Ui.Navbar.Link href="/services" current>Services</Ui.Navbar.Link><Ui.Navbar.Link href="/hosts">Hosts</Ui.Navbar.Link></Ui.Navbar.Nav>
      <Ui.Navbar.Sep />
      <Ui.Navbar.End><Ui.Badge tone="accent">picker</Ui.Badge></Ui.Navbar.End>
    </Ui.Navbar>
  ),
  split: (
    <Ui.Split style={{ height: 160 }}>
      <Ui.Split.Side><Ui.Sidebar label="Split demo"><Ui.Sidebar.Item href="#split" current>console</Ui.Sidebar.Item><Ui.Sidebar.Item href="#split">cloche</Ui.Sidebar.Item></Ui.Sidebar></Ui.Split.Side>
      <Ui.Split.Pane><Ui.Code.Pre style={{ height: "100%", margin: 0 }}>Pick an item on the left.</Ui.Code.Pre></Ui.Split.Pane>
    </Ui.Split>
  ),
  tabs: (
    <Ui.Tabs
      defaultValue="open"
      tabs={[{ value: "open", label: <>Open <Ui.Counter>24</Ui.Counter></> }, { value: "closed", label: <>Closed <Ui.Counter>180</Ui.Counter></> }]}
      panels={{ open: <p className="t-muted">24 open items.</p>, closed: <p className="t-muted">180 closed items.</p> }}
    />
  ),
  section: <Ui.Section title="Connection"><span className="t-muted">Section body text sits under the rule.</span></Ui.Section>,
  stack: (
    <Ui.Stack gap="2">
      <Ui.Cluster gap="2" align="center"><Ui.Badge tone="accent">cluster</Ui.Badge><Ui.Badge tone="success">wraps</Ui.Badge><Ui.Badge tone="info">gap 2</Ui.Badge></Ui.Cluster>
      <Ui.Cluster gap="2"><Ui.Badge>stack</Ui.Badge><Ui.Badge>row two</Ui.Badge></Ui.Cluster>
    </Ui.Stack>
  ),
  grid: (
    <Ui.Grid cols="auto" min="xs">
      {["one", "two", "three", "four"].map((n) => <Ui.Card key={n}><Ui.Card.Body>{n}</Ui.Card.Body></Ui.Card>)}
    </Ui.Grid>
  ),
};

// The Primer surface takes the same props as the CSS path (React.ComponentProps<typeof Css.X>); only some
// return types differ (Dialog/Confirm render null while closed), hence the cast.
export const islands: Record<string, ReactNode> = { ...makeFixtures(Ui as unknown as UiComponents), ...overrides };
