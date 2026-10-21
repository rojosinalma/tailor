// Showcase islands: component id → the React element the kit bundle renders into that component's `.sc-demo` box
// when the showcase's Kit picker says "react".
//
// Every island recreates the HTML demo of its component (core/components.json `demo`, or its canonical `markup`
// when it has none) through Ui.* only: same variants, texts and values, and the same demo interactions that
// showcase/showcase.js wires with `data-demo` (toggles, toasts, chip remove, password reveal, live range output,
// settings save mock with one failing row, dialog Save toast, confirm results). The showcase-only `data-demo`
// hooks themselves are left out, so showcase.js never acts on React-owned nodes. Tier-2 components keep their HTML.
import { useState, type ReactNode } from "react";
import { Ui, useToasts, type SaveResult } from "../../src/index.ts";

/* ── shell & layout ──────────────────────────────────────────────────────── */

const AppShellDemo = () => (
  <Ui.AppShell
    className="t-demo-shell"
    nav={
      <Ui.Navbar>
        <Ui.Navbar.Brand href="#">console</Ui.Navbar.Brand>
        <Ui.Navbar.Nav><Ui.Navbar.Link href="#" current>Services</Ui.Navbar.Link><Ui.Navbar.Link href="#">Hosts</Ui.Navbar.Link></Ui.Navbar.Nav>
      </Ui.Navbar>
    }
    side={
      <Ui.Sidebar label="Mock">
        <Ui.Sidebar.Group>Fleet</Ui.Sidebar.Group>
        <Ui.Sidebar.Item href="#" current>Overview</Ui.Sidebar.Item>
        <Ui.Sidebar.Item href="#" trail={<Ui.Counter>12</Ui.Counter>}>Devices</Ui.Sidebar.Item>
      </Ui.Sidebar>
    }
    foot={<Ui.Footer><Ui.Footer.Version>v0.9.2</Ui.Footer.Version></Ui.Footer>}
  >
    <Ui.Page.Header><Ui.Page.Title>Services</Ui.Page.Title></Ui.Page.Header>
    <p className="t-muted">Main column scrolls; sidebar and navbar stay.</p>
  </Ui.AppShell>
);

const NavbarDemo = () => (
  <Ui.Navbar>
    <Ui.Navbar.Brand href="/"><Ui.Icon name="bi-terminal" />console</Ui.Navbar.Brand>
    <Ui.Navbar.Nav>
      <Ui.Navbar.Link href="/services" current>Services</Ui.Navbar.Link>
      <Ui.Navbar.Link href="/hosts">Hosts</Ui.Navbar.Link>
    </Ui.Navbar.Nav>
    <Ui.Navbar.Sep />
    <Ui.Navbar.End>…picker…</Ui.Navbar.End>
  </Ui.Navbar>
);

const SidebarDemo = () => (
  <Ui.Sidebar label="Sections">
    <Ui.Sidebar.Group>Overview</Ui.Sidebar.Group>
    <Ui.Sidebar.Item href="#dash" current icon={<Ui.Icon name="bi-grid" />}>Dashboard</Ui.Sidebar.Item>
    <Ui.Sidebar.Item href="#alerts" icon={<Ui.Icon name="bi-exclamation-triangle" />} trail={<Ui.Counter tone="danger">3</Ui.Counter>}>Alerts</Ui.Sidebar.Item>
    <Ui.Sidebar.Collapsible open icon={<Ui.Icon name="bi-list" />} label="Devices" trail={<Ui.Counter>12</Ui.Counter>}>
      <Ui.Sidebar.Item href="#d1" icon={<Ui.Dot status="running" />}>epaper-display</Ui.Sidebar.Item>
    </Ui.Sidebar.Collapsible>
    <Ui.Sidebar.Divider />
    <Ui.Sidebar.Item href="#settings" icon={<Ui.Icon name="bi-gear" />}>Settings</Ui.Sidebar.Item>
  </Ui.Sidebar>
);

const FooterDemo = () => (
  <Ui.Footer>
    <Ui.Footer.Repo href="#" label="Repository"><Ui.Icon name="bi-github" /></Ui.Footer.Repo>
    <Ui.Footer.End>
      <Ui.Footer.Pickers parts={["mode"]} />
      <Ui.Footer.Version>v0.9.2</Ui.Footer.Version>
    </Ui.Footer.End>
  </Ui.Footer>
);

const PageDemo = () => (
  <Ui.Page as="div" style={{ padding: 0 }}>
    <Ui.Page.Header>
      <Ui.Page.Back href="#page" aria-label="Back" />
      <Ui.Page.Title>render</Ui.Page.Title>
      <Ui.Page.Lead>console service · web-1</Ui.Page.Lead>
      <Ui.Page.Actions><Ui.Button variant="secondary">Logs</Ui.Button><Ui.Button variant="primary">Deploy</Ui.Button></Ui.Page.Actions>
    </Ui.Page.Header>
  </Ui.Page>
);

const ToolbarDemo = () => (
  <Ui.Toolbar label="Table actions">
    <Ui.Button variant="primary">Save</Ui.Button>
    <Ui.Button>Cancel</Ui.Button>
    <Ui.Toolbar.Spacer />
    <Ui.Button variant="ghost" tone="danger">Delete</Ui.Button>
  </Ui.Toolbar>
);

const GridDemo = () => (
  <>
    <Ui.Grid cols="auto" min="xs">
      {["one", "two", "three", "four"].map((n) => <Ui.Card key={n}><Ui.Card.Body>{n}</Ui.Card.Body></Ui.Card>)}
    </Ui.Grid>
    <Ui.Grid cols="12" align="end" style={{ marginTop: "var(--t-space-3)" }}>
      <Ui.Field label="Name" id="g-name" data-span="6"><Ui.Input defaultValue="span 6" /></Ui.Field>
      <Ui.Field label="Kind" id="g-kind" data-span="4"><Ui.Select><option>span 4</option></Ui.Select></Ui.Field>
      <Ui.Button variant="primary" data-span="2">span 2</Ui.Button>
      <Ui.Field label="Notes" id="g-notes"><Ui.Input defaultValue="no data-span = full row" /></Ui.Field>
    </Ui.Grid>
  </>
);

const StackDemo = () => (
  <Ui.Stack gap="2">
    <Ui.Cluster gap="2" align="center"><Ui.Badge tone="accent">cluster</Ui.Badge><Ui.Badge tone="success">wraps</Ui.Badge><Ui.Badge tone="info">gap 2</Ui.Badge></Ui.Cluster>
    <Ui.Cluster gap="2"><Ui.Badge>stack</Ui.Badge><Ui.Badge>row two</Ui.Badge></Ui.Cluster>
  </Ui.Stack>
);

const SplitDemo = () => (
  <Ui.Split style={{ height: 160 }}>
    <Ui.Split.Side>
      <Ui.Sidebar label="Split demo"><Ui.Sidebar.Item href="#split" current>console</Ui.Sidebar.Item><Ui.Sidebar.Item href="#split">cloche</Ui.Sidebar.Item></Ui.Sidebar>
    </Ui.Split.Side>
    <Ui.Split.Pane><Ui.Code.Pre style={{ height: "100%", margin: 0 }}>Pick an item on the left.</Ui.Code.Pre></Ui.Split.Pane>
  </Ui.Split>
);

/* ── actions & navigation ────────────────────────────────────────────────── */

function ButtonDemo() {
  const [on, setOn] = useState(false);
  const icon = (name: string) => <Ui.Icon name={name} />;
  return (
    <Ui.Stack gap="2">
      <Ui.Cluster gap="2">
        <Ui.Button variant="primary">{icon("bi-plus-lg")}Primary</Ui.Button>
        <Ui.Button variant="secondary">Secondary</Ui.Button>
        <Ui.Button variant="danger">Danger</Ui.Button>
        <Ui.Button variant="warning">Warning</Ui.Button>
        <Ui.Button variant="ghost">Ghost</Ui.Button>
        <Ui.Button variant="ghost" tone="danger">Ghost danger</Ui.Button>
        <Ui.Button variant="link">Link</Ui.Button>
      </Ui.Cluster>
      <Ui.Cluster gap="2" align="center">
        <Ui.Button variant="primary" size="xs">Tiny</Ui.Button>
        <Ui.Button variant="primary" size="sm">Small</Ui.Button>
        <Ui.Button variant="primary">Medium</Ui.Button>
        <Ui.Button variant="primary" size="lg">Large</Ui.Button>
        <Ui.Button>{icon("bi-download")}Leading</Ui.Button>
        <Ui.Button>Counter <Ui.Counter>12</Ui.Counter></Ui.Button>
      </Ui.Cluster>
      <Ui.Cluster gap="2">
        <Ui.Button variant="primary" disabled>Disabled</Ui.Button>
        <Ui.Button disabled>Disabled</Ui.Button>
        <Ui.Button variant="primary" busy>Saving…</Ui.Button>
        <Ui.Button pressed>Pinned</Ui.Button>
        <Ui.Button pressed={on} onClick={() => setOn(!on)}>Toggle me</Ui.Button>
      </Ui.Cluster>
      <Ui.Cluster gap="2">
        <Ui.Button iconOnly tip="Edit">{icon("bi-pencil")}</Ui.Button>
        <Ui.Button iconOnly tip="Copy">{icon("bi-copy")}</Ui.Button>
        <Ui.Button iconOnly variant="danger" tip="Delete">{icon("bi-trash")}</Ui.Button>
        <Ui.Button iconOnly variant="ghost" tip="More">{icon("bi-three-dots-vertical")}</Ui.Button>
        <Ui.Button iconOnly size="xs" variant="ghost" tip="Tiny">{icon("bi-three-dots-vertical")}</Ui.Button>
        <Ui.Button iconOnly variant="primary" size="sm" tip="Add">{icon("bi-plus-lg")}</Ui.Button>
        <Ui.Button iconOnly size="lg" tip="Settings">{icon("bi-gear")}</Ui.Button>
      </Ui.Cluster>
    </Ui.Stack>
  );
}

const ButtonGroupDemo = () => (
  <Ui.Cluster gap="3">
    <Ui.ButtonGroup label="Range">
      <Ui.Button size="sm">Hour</Ui.Button>
      <Ui.Button size="sm">Day</Ui.Button>
      <Ui.Button size="sm">Week</Ui.Button>
    </Ui.ButtonGroup>
    <Ui.ButtonGroup
      label="State"
      filter
      defaultValue="all"
      options={[
        { value: "all", label: "All" },
        { value: "running", label: "Running" },
        { value: "updates", label: <>Updates <Ui.Counter tone="warning">15</Ui.Counter></> },
      ]}
    />
  </Ui.Cluster>
);

const SegmentedDemo = () => (
  <Ui.Cluster gap="3" align="center">
    <Ui.Segmented
      label="View" name="seg-view" defaultValue="cards"
      options={[{ value: "cards", label: "Cards" }, { value: "table", label: "Table" }, { value: "list", label: "List", disabled: true }]}
    />
    <Ui.Segmented
      label="Density" name="seg-dens" size="sm" defaultValue="comfortable"
      options={[{ value: "comfortable", label: "☰", tip: "Comfortable" }, { value: "compact", label: "≡", tip: "Compact" }]}
    />
  </Ui.Cluster>
);

const MenuDemo = () => (
  <Ui.Cluster gap="3">
    <Ui.Menu trigger="Filter ▾">
      <Ui.Menu.Header>Show</Ui.Menu.Header>
      <Ui.Menu.Item defaultChecked>Running</Ui.Menu.Item>
      <Ui.Menu.Item defaultChecked={false}>Stopped</Ui.Menu.Item>
      <Ui.Menu.Item defaultChecked={false}>Updates available<Ui.Menu.Desc>images behind the registry</Ui.Menu.Desc></Ui.Menu.Item>
      <Ui.Menu.Divider />
      <Ui.Menu.Item tone="danger">Delete…</Ui.Menu.Item>
    </Ui.Menu>
    <Ui.Menu trigger="Start ▾" align="end" variant="primary">
      <Ui.Menu.Item>Start with rebuild<Ui.Menu.Kbd>⌘R</Ui.Menu.Kbd></Ui.Menu.Item>
      <Ui.Menu.Item>Start and follow logs</Ui.Menu.Item>
    </Ui.Menu>
  </Ui.Cluster>
);

const TabsDemo = () => (
  <Ui.Grid cols="2" min="sm">
    <Ui.Tabs
      variant="underline"
      panelClassName="t-muted"
      tabs={[
        { value: "u1", label: <>Open <Ui.Counter>24</Ui.Counter></> },
        { value: "u2", label: <>Closed <Ui.Counter>180</Ui.Counter></> },
        { value: "u3", label: <>Pull requests <Ui.Counter>6</Ui.Counter></> },
      ]}
      panels={{ u1: "24 open issues, newest first.", u2: "Closed in the last 30 days.", u3: "Awaiting review." }}
    />
    <Ui.Tabs
      variant="boxed"
      tabs={[{ value: "b1", label: "Compose" }, { value: "b2", label: "Environment" }, { value: "b3", label: "Logs", disabled: true }]}
      panels={{ b1: <><code>compose.yaml</code> as the console wrote it.</>, b2: "Non-secret structural variables only." }}
    />
  </Ui.Grid>
);

const BreadcrumbDemo = () => (
  <Ui.Breadcrumb>
    <Ui.Breadcrumb.Item href="/">Home</Ui.Breadcrumb.Item>
    <Ui.Breadcrumb.Item href="/services">Services</Ui.Breadcrumb.Item>
    <Ui.Breadcrumb.Item current>render</Ui.Breadcrumb.Item>
  </Ui.Breadcrumb>
);

const PaginationDemo = () => (
  <Ui.Cluster gap="4" align="center">
    <Ui.Pagination aria-label="Pages" size="sm">
      <Ui.Pagination.Link disabled>«</Ui.Pagination.Link>
      <Ui.Pagination.Link href="#pagination" current>1</Ui.Pagination.Link>
      <Ui.Pagination.Link href="#pagination">2</Ui.Pagination.Link>
      <Ui.Pagination.Link href="#pagination">3</Ui.Pagination.Link>
      <Ui.Pagination.Link disabled>…</Ui.Pagination.Link>
      <Ui.Pagination.Link href="#pagination">12</Ui.Pagination.Link>
      <Ui.Pagination.Link href="#pagination">»</Ui.Pagination.Link>
    </Ui.Pagination>
    <Ui.Pagination aria-label="Newer/older">
      <Ui.Pagination.Link href="#pagination">‹ Newer</Ui.Pagination.Link>
      <Ui.Pagination.Link href="#pagination">Older ›</Ui.Pagination.Link>
    </Ui.Pagination>
  </Ui.Cluster>
);

const ListDemo = () => (
  <Ui.Grid cols="2" min="sm">
    <Ui.List label="Host" defaultSelected={["web-1"]}>
      <Ui.List.Group>Hosts</Ui.List.Group>
      <Ui.List.Item value="web-1" lead="bi-list" name="web-1" desc="192.168.1.20 · 24 services" trail="primary" />
      <Ui.List.Item value="nas" lead="bi-list" name="nas" desc="192.168.1.50 · NAS" trail={<Ui.Badge className="t-list-trail" tone="success">online</Ui.Badge>} />
      <Ui.List.Item value="node-3" lead="bi-list" name="node-3-with-a-very-long-hostname-that-truncates" trail={<Ui.Badge className="t-list-trail" tone="neutral">offline</Ui.Badge>} />
      <Ui.List.Divider />
      <Ui.List.Item value="add" lead="bi-plus-lg" name="Add a host" desc="needs the admin role" disabled />
    </Ui.List>
    <Ui.List label="Checks" multi defaultSelected={["http", "body"]}>
      <Ui.List.Item value="http" lead={<span className="t-list-lead"></span>} name="HTTP 200" />
      <Ui.List.Item value="body" lead={<span className="t-list-lead"></span>} name={<>Body <code>ok == true</code></>} />
      <Ui.List.Item value="cert" lead={<span className="t-list-lead"></span>} name="Certificate > 7 days" desc="warns a week before expiry" />
    </Ui.List>
  </Ui.Grid>
);

/* ── forms ───────────────────────────────────────────────────────────────── */

function FieldDemo() {
  const { toast } = useToasts();
  const [shown, setShown] = useState(false);
  const [range, setRange] = useState("60");
  return (
    <Ui.Grid cols="2" min="sm">
      <Ui.Stack gap="3">
        <Ui.Field label="Hostname" id="f-host" hint="Caption: the LAN name, without scheme."><Ui.Input placeholder="example.internal" /></Ui.Field>
        <Ui.Field label="Token" id="f-tok" hint="Leading addon + trailing action.">
          <Ui.InputGroup>
            <Ui.InputAddon>🔑</Ui.InputAddon>
            <Ui.Input id="f-tok" type={shown ? "text" : "password"} defaultValue="secret-token" />
            <Ui.Button type="button" tip="Show" onClick={() => setShown(!shown)}>👁</Ui.Button>
          </Ui.InputGroup>
        </Ui.Field>
        <Ui.Field label="Subdomain" id="f-ok" success="✓ Available."><Ui.Input defaultValue="render" /></Ui.Field>
        <Ui.Field label="Port" id="f-bad" error="✕ Must be between 1 and 65535."><Ui.Input defaultValue="99999" /></Ui.Field>
      </Ui.Stack>
      <Ui.Stack gap="3">
        <Ui.Cluster gap="2">
          <Ui.Field label="Visibility" id="f-vis"><Ui.Select><option>public</option><option>local</option></Ui.Select></Ui.Field>
          <Ui.Field label="Port" id="f-port">
            <Ui.InputGroup><Ui.InputAddon>:</Ui.InputAddon><Ui.Input id="f-port" defaultValue="9292" htmlSize={6} /></Ui.InputGroup>
          </Ui.Field>
        </Ui.Cluster>
        <Ui.Cluster gap="2">
          <Ui.Field label="Read-only" id="f-ro"><Ui.Input readOnly defaultValue="ses_f159fc741ffe" /></Ui.Field>
          <Ui.Field label="Disabled" id="f-dis"><Ui.Input disabled defaultValue="not editable" /></Ui.Field>
        </Ui.Cluster>
        <Ui.Field label="Notes" id="f-notes"><Ui.Textarea rows={2} defaultValue="Grows with its content." /></Ui.Field>
        <Ui.Field label={<>Brightness <output className="t-muted" htmlFor="f-range" id="f-range-out">{`${range} %`}</output></>} id="f-range">
          <Ui.Input type="range" value={range} onChange={(e) => setRange(e.target.value)} />
        </Ui.Field>
        <Ui.Field label="Small field" id="f-sm" data-size="sm"><Ui.Input defaultValue="data-size=sm" /></Ui.Field>
        <Ui.Toolbar role={undefined}>
          <Ui.Select data-width="auto" aria-label="Range"><option>24 h</option><option>7 d</option></Ui.Select>
          <Ui.Input data-width="auto" placeholder="Filter…" aria-label="Filter" />
          <span className="t-muted t-small t-nowrap">data-width=auto</span>
        </Ui.Toolbar>
        <Ui.Form validate="live" onSubmit={(e) => { e.preventDefault(); toast("success", "Valid — the form would submit now"); }}>
          <Ui.Field label="Service name (required, min 3)" id="f-req"><Ui.Input required minLength={3} placeholder="web-1" /></Ui.Field>
          <Ui.Field label="Owner e-mail" id="f-mail" hint="Submit empty: tailor draws the feedback, no browser bubble (Tailor.forms).">
            <Ui.Input type="email" placeholder="alice@example.internal" />
          </Ui.Field>
          <Ui.Cluster gap="2">
            <Ui.Button variant="primary" size="sm" type="submit">Save</Ui.Button>
            <Ui.Button size="sm" type="reset">Reset</Ui.Button>
          </Ui.Cluster>
        </Ui.Form>
      </Ui.Stack>
    </Ui.Grid>
  );
}

const CheckDemo = () => (
  <Ui.Grid cols="3" min="xs">
    <Ui.CheckGroup legend="Notify on">
      <Ui.Check defaultChecked label="Failure" desc="Any job that exits non-zero." />
      <Ui.Check label="Recovery" />
      <Ui.Check aria-invalid="true" label="Needs at least one" />
      <Ui.Check disabled label="Disabled" />
    </Ui.CheckGroup>
    <Ui.CheckGroup legend="Exposure">
      <Ui.Check type="radio" name="exp" defaultChecked label="Public" desc="Tunnel + Access policy." />
      <Ui.Check type="radio" name="exp" label="LAN only" />
    </Ui.CheckGroup>
    <Ui.CheckGroup legend="Switches">
      <Ui.Check switch defaultChecked label="Protected" />
      <Ui.Check switch label="Auto-update" />
      <Ui.Check switch disabled defaultChecked label="Locked" />
    </Ui.CheckGroup>
  </Ui.Grid>
);

const DurationDemo = () => <Ui.DurationInput setting="offline_after_s" defaultValue={900} id="offline" label="Offline after" />;

// the showcase's save mock (showcase/showcase.js): 500 ms, the fail_demo row is rejected
const demoSave = (key: string, value: string) => new Promise<SaveResult>((res) => setTimeout(() => res(
  key === "fail_demo" ? { ok: false, message: `${key}: rejected by the demo API (value "${value}")` } : { ok: true, message: `${key} saved` }), 500));

const SettingsDemo = () => (
  <Ui.Settings save={demoSave}>
    <Ui.SettingsRow
      label="Device name" htmlFor="s-name" setting="name"
      help={{ tone: "info", label: "About device name", children: <p>Shown in every list, toast and alert. Defaults to the hostname.</p> }}
    >
      <Ui.Input size="sm" id="s-name" defaultValue="epaper-display" />
    </Ui.SettingsRow>
    <Ui.SettingsRow
      label="Power regime" htmlFor="s-regime" setting="regime"
      help={{ tone: "info", label: "About power regime", children: <><p><b>Always on</b> keeps the panel awake on mains.</p><p><b>Hold on battery</b> shows the dashboard, then holds the wallpaper.</p></> }}
    >
      <Ui.Select size="sm" id="s-regime" defaultValue="battery_hold">
        <option value="always_on">Always on</option>
        <option value="battery_hold">Hold on battery</option>
      </Ui.Select>
    </Ui.SettingsRow>
    <Ui.SettingsRow label="Offline after" htmlFor="s-offline">
      <Ui.DurationInput size="sm" setting="offline_after_s" defaultValue={900} id="s-offline" />
    </Ui.SettingsRow>
    <Ui.SettingsRow label="Battery overlay" htmlFor="s-overlay" setting="battery_overlay_enabled">
      <Ui.Check switch id="s-overlay" defaultChecked label="" />
    </Ui.SettingsRow>
    <Ui.SettingsRow
      label="Fails on purpose" htmlFor="s-fail" setting="fail_demo"
      help={{ tone: "danger", label: "Important", glyph: "!", children: <p>Demo of the error path: the save is rejected, the toast says why, the control reverts.</p> }}
    >
      <Ui.Input size="sm" id="s-fail" defaultValue="change me" />
    </Ui.SettingsRow>
  </Ui.Settings>
);

/* ── data display ────────────────────────────────────────────────────────── */

function BadgeDemo() {
  const [accent, setAccent] = useState(true);
  return (
    <Ui.Stack gap="2">
      <Ui.Cluster gap="1">
        <Ui.Badge>default</Ui.Badge>
        <Ui.Badge tone="text" variant="outline">primary</Ui.Badge>
        <Ui.Badge tone="accent">accent</Ui.Badge>
        <Ui.Badge tone="success">success</Ui.Badge>
        <Ui.Badge tone="warning">attention</Ui.Badge>
        <Ui.Badge tone="pink">severe</Ui.Badge>
        <Ui.Badge tone="danger">danger</Ui.Badge>
        <Ui.Badge tone="purple">✓ done</Ui.Badge>
        <Ui.Badge tone="yellow">auth</Ui.Badge>
        <Ui.Badge tone="info">open</Ui.Badge>
        <Ui.Badge tone="warning" variant="solid">▲ Update</Ui.Badge>
      </Ui.Cluster>
      <Ui.Cluster gap="1" align="center">
        <Ui.Badge tone="info" size="xs">xs</Ui.Badge>
        <Ui.Badge tone="info" size="sm">sm</Ui.Badge>
        <Ui.Badge tone="info">default</Ui.Badge>
        <Ui.Badge tone="info" size="lg">lg</Ui.Badge>
        <Ui.Badge as="button" tone={accent ? "accent" : "neutral"} onClick={() => setAccent(!accent)}>badge as button</Ui.Badge>
      </Ui.Cluster>
    </Ui.Stack>
  );
}

const CounterDemo = () => (
  <Ui.Cluster gap="3" align="center">
    <span>Issues <Ui.Counter>24</Ui.Counter></span>
    <span>Failing <Ui.Counter tone="danger">3</Ui.Counter></span>
    <span>Updates <Ui.Counter tone="warning">15</Ui.Counter></span>
    <span>New <Ui.Counter tone="success">+2</Ui.Counter></span>
    <Ui.Counter tone="accent">1 204</Ui.Counter>
  </Ui.Cluster>
);

function ChipDemo() {
  const [filters, setFilters] = useState([{ text: "host:web-1", tone: "info" as const }, { text: "kind:custom", tone: "accent" as const }]);
  return (
    <Ui.Cluster gap="2">
      <Ui.Chip tone="success"><Ui.Icon name="bi-list" />web-1</Ui.Chip>
      <Ui.Chip tone="warning"><Ui.Icon name="bi-list" />nas</Ui.Chip>
      {filters.map((f) => (
        <Ui.Chip key={f.text} tone={f.tone} removeLabel={`Remove ${f.text}`} onRemove={() => setFilters((fs) => fs.filter((x) => x !== f))}>{f.text} </Ui.Chip>
      ))}
    </Ui.Cluster>
  );
}

const StateLabelDemo = () => (
  <Ui.Stack gap="2">
    <Ui.Cluster gap="2">
      <Ui.StateLabel state="open" icon="bi-record-circle">Open</Ui.StateLabel>
      <Ui.StateLabel state="closed" icon="bi-slash-circle">Closed</Ui.StateLabel>
      <Ui.StateLabel state="done" icon="bi-check-lg">Completed</Ui.StateLabel>
      <Ui.StateLabel state="done" icon="bi-git">Merged</Ui.StateLabel>
      <Ui.StateLabel state="draft" icon="bi-pencil">Draft</Ui.StateLabel>
    </Ui.Cluster>
    <Ui.Cluster gap="2">
      <Ui.StateLabel state="info" icon="bi-eye">In review</Ui.StateLabel>
      <Ui.StateLabel state="warning" icon="bi-exclamation-triangle">Degraded</Ui.StateLabel>
      <Ui.StateLabel state="done" variant="solid" icon="bi-rocket-takeoff">Deployed</Ui.StateLabel>
      <Ui.StateLabel state="open" size="sm" icon="bi-record-circle">Open</Ui.StateLabel>
      <Ui.StateLabel state="draft" size="sm" icon="bi-hourglass">Queued</Ui.StateLabel>
    </Ui.Cluster>
  </Ui.Stack>
);

const StatusDotDemo = () => (
  <Ui.Cluster gap="3" align="center">
    <span><Ui.Dot status="running" /> healthy</span>
    <span><Ui.Dot status="degraded" /> degraded</span>
    <span><Ui.Dot status="stopped" /> stopped</span>
    <span><Ui.Dot status="muted" /> muted</span>
  </Ui.Cluster>
);

const AvatarDemo = () => (
  <Ui.Stack gap="2">
    <Ui.Cluster gap="2" align="center">
      <Ui.Avatar size="xs" tone="purple">a</Ui.Avatar>
      <Ui.Avatar size="sm" tone="green">rs</Ui.Avatar>
      <Ui.Avatar tone="cyan">AL</Ui.Avatar>
      <Ui.Avatar size="lg" tone="orange">AL</Ui.Avatar>
      <Ui.Avatar size="xl" tone="pink">AL</Ui.Avatar>
      <Ui.Avatar size="lg" shape="square" tone="purple">▤</Ui.Avatar>
    </Ui.Cluster>
    <Ui.Cluster gap="3" align="center">
      <Ui.Avatar tone="purple" status="online">AL</Ui.Avatar>
      <Ui.Avatar tone="cyan" status="busy">TM</Ui.Avatar>
      <Ui.Avatar tone="neutral" status="offline">OF</Ui.Avatar>
      <Ui.Avatar.Stack>
        <Ui.Avatar tone="purple">AL</Ui.Avatar>
        <Ui.Avatar tone="green">TM</Ui.Avatar>
        <Ui.Avatar tone="cyan">AK</Ui.Avatar>
        <Ui.Avatar more>+3</Ui.Avatar>
      </Ui.Avatar.Stack>
      <Ui.Avatar.Row name="alice" desc={<>owner · last seen <Ui.RelativeTime ago={5400} /></>}><Ui.Avatar tone="green">AL</Ui.Avatar></Ui.Avatar.Row>
    </Ui.Cluster>
  </Ui.Stack>
);

const Owner = ({ tone, who }: { tone: "purple" | "cyan"; who: string }) => (
  <Ui.Avatar.Row><Ui.Avatar size="xs" tone={tone}>{who[0]}</Ui.Avatar>{who}</Ui.Avatar.Row>
);

const LogRow = ({ tone, when, via, viaTone, op, result, code, detail }: { tone: "success" | "warning" | "danger"; when: string; via: string; viaTone: "green" | "purple" | "cyan" | "orange"; op: string; result: string; code: string; detail: string }) => (
  <tr data-tone={tone}>
    <td className="t-mono">{when}</td>
    <td><Ui.Badge tone={viaTone} size="xs">{via}</Ui.Badge></td>
    <td className="t-mono">{op}</td>
    <td data-tone={tone} className="t-tone-text">{result}</td>
    <td className="t-mono">{code}</td>
    <td className="t-muted">{detail}</td>
  </tr>
);

const TableDemo = () => (
  <Ui.Stack gap="3">
    <Ui.Table.Wrap>
      <Ui.Table variant="data" sortable>
        <thead>
          <tr>
            <Ui.Table.Th icon></Ui.Table.Th>
            <Ui.Table.Th sort="name" dir="ascending">Name</Ui.Table.Th>
            <Ui.Table.Th sort="image">Image</Ui.Table.Th>
            <Ui.Table.Th num sort="cpu">CPU</Ui.Table.Th>
            <Ui.Table.Th shrink>State</Ui.Table.Th>
            <th>Owner</th>
            <Ui.Table.Th actions>Actions</Ui.Table.Th>
          </tr>
        </thead>
        <Ui.Table.Body>
          <Ui.Table.Group colSpan={7}>Custom</Ui.Table.Group>
          <tr key="console" data-name="console" data-image="build" data-cpu="12">
            <Ui.Table.Td icon><Ui.Dot status="running" /></Ui.Table.Td>
            <td>console</td>
            <td className="t-muted">build</td>
            <Ui.Table.Td num className="t-mono">12 %</Ui.Table.Td>
            <td><Ui.Badge tone="success">running</Ui.Badge></td>
            <td><Owner tone="purple" who="alice" /></td>
            <Ui.Table.Td actions><Ui.Button size="sm" iconOnly tip="Restart">↻</Ui.Button> <Ui.Button size="sm" iconOnly variant="danger" tip="Stop">■</Ui.Button></Ui.Table.Td>
          </tr>
          <tr key="myokymia" data-name="myokymia" data-image="build" data-cpu="0">
            <Ui.Table.Td icon><Ui.Dot status="stopped" /></Ui.Table.Td>
            <td>myokymia</td>
            <td className="t-muted">build</td>
            <Ui.Table.Td num className="t-mono">0 %</Ui.Table.Td>
            <td><Ui.Badge tone="neutral">stopped</Ui.Badge></td>
            <td><Owner tone="purple" who="alice" /></td>
            <Ui.Table.Td actions><Ui.Button size="sm" iconOnly tip="Start">▶</Ui.Button></Ui.Table.Td>
          </tr>
          <Ui.Table.Group colSpan={7}>Self-hosted</Ui.Table.Group>
          <tr key="beszel" data-name="beszel" data-image="henrygd/beszel" data-cpu="4">
            <Ui.Table.Td icon><Ui.Dot status="degraded" /></Ui.Table.Td>
            <td>beszel</td>
            <td className="t-muted">henrygd/beszel:latest</td>
            <Ui.Table.Td num className="t-mono">4 %</Ui.Table.Td>
            <td><Ui.Badge tone="warning" variant="solid">Update</Ui.Badge></td>
            <td><Owner tone="cyan" who="nas" /></td>
            <Ui.Table.Td actions><Ui.Button size="sm" iconOnly variant="warning" tip="Pull update">⇩</Ui.Button></Ui.Table.Td>
          </tr>
        </Ui.Table.Body>
      </Ui.Table>
    </Ui.Table.Wrap>
    <Ui.Table.Wrap style={{ maxHeight: "9rem" }}>
      <Ui.Table variant="log">
        <thead><tr><th>When</th><th>Via</th><th>Op</th><th>Result</th><th>Code</th><th>Detail</th></tr></thead>
        <tbody>
          <LogRow tone="success" when="15:02:41" via="mqtt" viaTone="green" op="status" result="ok" code="200" detail="" />
          <LogRow tone="danger" when="15:01:12" via="http" viaTone="purple" op="install" result="rejected" code="401" detail="unauthorized" />
          <LogRow tone="warning" when="14:02:09" via="stream" viaTone="cyan" op="install display 0.3.0" result="accepted" code="202" detail="flashed ota_1 · rebooting" />
          <LogRow tone="warning" when="13:58:40" via="queue" viaTone="orange" op="reboot" result="queued" code="–" detail="waiting for the device" />
          <LogRow tone="success" when="13:40:02" via="mqtt" viaTone="green" op="status" result="ok" code="200" detail="" />
        </tbody>
      </Ui.Table>
    </Ui.Table.Wrap>
  </Ui.Stack>
);

function CardDemo() {
  const { toast } = useToasts();
  return (
    <Ui.Stack gap="3">
      <Ui.Grid cols="3" min="xs">
        <Ui.Card variant="clickable" role="button" tabIndex={0} onClick={(e) => { if (!(e.target as Element).closest("button")) toast("info", "Card clicked: opens its detail"); }}>
          <Ui.Card.Header><Ui.Card.Title><Ui.Icon name="bi-grid" />render</Ui.Card.Title><Ui.Dot status="running" /></Ui.Card.Header>
          <Ui.Card.Body>
            <Ui.Cluster gap="1"><Ui.Badge tone="accent">custom</Ui.Badge><Ui.Chip tone="success">web-1</Ui.Chip></Ui.Cluster>
            <p className="t-muted t-small">Whole card is the target, buttons stop propagation.</p>
            <Ui.Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); toast("warning", "Stop requested"); }}>■ Stop</Ui.Button>
          </Ui.Card.Body>
        </Ui.Card>
        <Ui.Card variant="clickable" selected role="button" tabIndex={0}>
          <Ui.Card.Header><Ui.Card.Title><Ui.Icon name="bi-grid" />console-with-a-very-long-name</Ui.Card.Title><Ui.Badge tone="warning" variant="solid">Update</Ui.Badge></Ui.Card.Header>
          <Ui.Card.Body>
            <Ui.Cluster gap="1"><Ui.Badge tone="info">self-hosted</Ui.Badge><Ui.Chip tone="warning">nas</Ui.Chip></Ui.Cluster>
            <p className="t-muted t-small">aria-selected: sticky accent ring, title truncates.</p>
          </Ui.Card.Body>
        </Ui.Card>
        <Ui.Card>
          <Ui.Card.Header>
            <Ui.Card.Title><Ui.Icon name="bi-cpu" />sensor-c3</Ui.Card.Title>
            <Ui.Card.Tools>
              <span className="t-muted t-small t-hide" data-hide="sm">2 min ago</span>
              <Ui.Button size="xs" variant="ghost" iconOnly tip="Refresh"><Ui.Icon name="bi-arrow-clockwise" /></Ui.Button>
              <Ui.Dot status="degraded" />
            </Ui.Card.Tools>
          </Ui.Card.Header>
          <Ui.Card.Body>
            <Ui.Facts>
              <dt>IP</dt><dd>192.168.1.42</dd>
              <dt>Firmware</dt><dd>v0.6.2 · base 1.4</dd>
              <dt>Playlist</dt><dd>printer-status-with-a-long-name</dd>
              <dt>RSSI</dt><dd data-tone="warning" className="t-tone-text">-71 dBm</dd>
            </Ui.Facts>
            <Ui.Card.Actions><Ui.Button size="sm">↻ Reboot</Ui.Button><Ui.Button size="sm" variant="primary">Identify</Ui.Button></Ui.Card.Actions>
          </Ui.Card.Body>
        </Ui.Card>
      </Ui.Grid>
      <Ui.Grid cols="4" min="xs">
        <Ui.Card variant="thumb clickable" role="button" tabIndex={0}>
          <Ui.Card.Thumb>
            <svg viewBox="0 0 160 120" aria-hidden="true"><rect x="20" y="30" width="120" height="70" rx="6" fill="var(--t-selection)" /><circle cx="60" cy="60" r="14" fill="var(--t-accent)" /><path d="M40 95 L80 60 L110 85 L140 65 L140 100 L40 100Z" fill="var(--t-success)" /></svg>
          </Ui.Card.Thumb>
          <Ui.Card.Meta><Ui.Icon name="bi-image" className="t-muted" /><Ui.Truncate>render-front-view-final.png</Ui.Truncate><Ui.Badge size="xs">1.2 MB</Ui.Badge></Ui.Card.Meta>
        </Ui.Card>
        <Ui.Card variant="thumb clickable" role="button" tabIndex={0}>
          <Ui.Card.Thumb ratio="square">
            <svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="48" fill="var(--t-canvas)" stroke="var(--t-border)" /><circle cx="50" cy="50" r="36" fill="none" stroke="var(--t-success)" strokeWidth="6" strokeDasharray="160 66" transform="rotate(-90 50 50)" /></svg>
          </Ui.Card.Thumb>
          <Ui.Card.Meta><Ui.Truncate>printing-240</Ui.Truncate><Ui.Badge tone="info" size="xs">240</Ui.Badge></Ui.Card.Meta>
        </Ui.Card>
        <Ui.Card variant="stat">
          <Ui.Card.Body>
            <Ui.Cluster align="baseline"><Ui.StatLabel as="span">Requests / min</Ui.StatLabel><Ui.Toolbar.Spacer /><Ui.StatValue as="span">1 204</Ui.StatValue></Ui.Cluster>
            <Ui.StatBox>
              <svg viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><polyline fill="none" stroke="var(--t-success)" strokeWidth="1.5" points="0,25 10,20 20,22 30,12 40,15 50,8 60,12 70,6 80,10 90,4 100,7" /></svg>
            </Ui.StatBox>
          </Ui.Card.Body>
        </Ui.Card>
        <Ui.Card variant="stat">
          <Ui.Card.Body>
            <Ui.Cluster align="baseline"><Ui.StatLabel as="span">Renders / min</Ui.StatLabel><Ui.Toolbar.Spacer /><Ui.StatValue as="span"><Ui.StatSub as="span">no data</Ui.StatSub></Ui.StatValue></Ui.Cluster>
            <Ui.StatBox empty>Collecting…</Ui.StatBox>
          </Ui.Card.Body>
        </Ui.Card>
      </Ui.Grid>
      <Ui.Grid cols="2" min="sm">
        <Ui.Card collapsible open>
          <Ui.Card.Header><Ui.Card.Title>Self-hosted <Ui.Counter>3</Ui.Counter></Ui.Card.Title><span className="t-sidebar-chevron"></span></Ui.Card.Header>
          <Ui.Card.Body>
            <ul className="t-plain-list">
              <li><Ui.Dot status="running" /> beszel <span className="t-muted t-small">henrygd/beszel</span></li>
              <li><Ui.Dot status="running" /> gatus <span className="t-muted t-small">twinproduction/gatus</span></li>
              <li><Ui.Dot status="stopped" /> registry <span className="t-muted t-small">registry:2</span></li>
            </ul>
          </Ui.Card.Body>
        </Ui.Card>
        <Ui.Card><Ui.Card.Body><NoServices /></Ui.Card.Body></Ui.Card>
      </Ui.Grid>
    </Ui.Stack>
  );
}

const NoServices = () => (
  <Ui.EmptyState
    icon="bi-inbox" title="No services yet"
    actions={<><Ui.Button variant="primary" size="sm">＋ New service</Ui.Button><Ui.Button variant="ghost" size="sm">Import compose</Ui.Button></>}
  >
    <p>Register the first one and it shows up here with its health.</p>
  </Ui.EmptyState>
);

const EmptyStateDemo = () => (
  <Ui.Grid cols="2" min="sm">
    <NoServices />
    <Ui.EmptyState icon="bi-search" size="sm"><p>No token matches — clear the filter.</p></Ui.EmptyState>
  </Ui.Grid>
);

const TimelineDemo = () => (
  <Ui.Timeline>
    <Ui.Timeline.Item tone="success" badge="＋"><b>alice</b> created the service <Ui.RelativeTime ago={259200} /></Ui.Timeline.Item>
    <Ui.Timeline.Item condensed tone="accent" badge="⑂"><code>a1b2c3d</code> fix: tunnel ingress order <Ui.RelativeTime ago={200000} /></Ui.Timeline.Item>
    <Ui.Timeline.Item condensed tone="accent" badge="⑂"><code>d4e5f6a</code> feat: health monitor <Ui.RelativeTime ago={190000} /></Ui.Timeline.Item>
    <Ui.Timeline.Item tone="info" badge="✎">
      <b>agent</b> commented <Ui.RelativeTime ago={86400} />
      <Ui.Timeline.Card>Health check green from inside the container; the host loopback probe proves nothing.</Ui.Timeline.Card>
    </Ui.Timeline.Item>
    <Ui.Timeline.Break />
    <Ui.Timeline.Item tone="danger" badge="✕">
      <b>gatus</b> reported <Ui.StateLabel state="closed" size="sm" icon="bi-slash-circle">down</Ui.StateLabel> for 4 min <Ui.RelativeTime ago={5400} />
    </Ui.Timeline.Item>
    <Ui.Timeline.Item tone="accent" solid badge="🚀"><b>console</b> deployed <b>v0.9.2</b> <Ui.RelativeTime ago={120} /></Ui.Timeline.Item>
  </Ui.Timeline>
);

const RelativeTimeDemo = () => (
  <Ui.Cluster gap="3">
    {[10, 180, 7200, 86400, 345600, 2592000, -3600].map((ago) => <Ui.RelativeTime key={ago} ago={ago} />)}
  </Ui.Cluster>
);

/* ── feedback ────────────────────────────────────────────────────────────── */

const TooltipDemo = () => (
  <Ui.Cluster gap="2" align="center">
    <Ui.Button size="sm" tip="Tooltips repeat or label, nothing more">Hover me</Ui.Button>
    <Ui.Tooltip tip="Open 3 days" at="bottom"><Ui.Badge tone="info">tip below</Ui.Badge></Ui.Tooltip>
    <Ui.Tooltip tip="Opens the service" at="right"><a href="#tooltip">link with tip</a></Ui.Tooltip>
  </Ui.Cluster>
);

const HelpPopoverDemo = () => (
  <Ui.Stack gap="2">
    <div>
      <b>Heartbeat</b> <span className="t-muted">60 s</span>{" "}
      <Ui.Help tone="accent" glyph="?" label="Help: heartbeat">
        <p><b>Help</b> (accent ?): configuration values and how to set, configure or use the thing.</p>
        <p>Set in <code>Settings → Devices</code>; the board reads it at its next check-in.</p>
      </Ui.Help>
    </div>
    <div>
      <b>Last will</b> <span className="t-muted">offline</span>{" "}
      <Ui.Help tone="info" label="Info: last will"><p><b>Info</b> (i): pure explanation and added context, nothing to act on.</p></Ui.Help>
    </div>
    <div>
      <b>Factory slot</b> <span className="t-muted">recovery 1.4.0</span>{" "}
      <Ui.Help tone="danger" glyph="!" label="Important: factory slot">
        <p><b>Important</b> (!): the field is critical or dangerous, read before touching.</p>
        <p>Overwriting the factory slot removes the only way back after a bad OTA.</p>
      </Ui.Help>
    </div>
  </Ui.Stack>
);

const AUTH = ["'Authorization: Basic YWRtaW46czNjcmV0'", "'Authorization: Bearer hgr_2884858d607c_9Kd3pQx7Lm2Vn8Rt'"];

function CodeBlockDemo() {
  const [tab, setTab] = useState(0);
  const T = Ui.Code.Tok;
  return (
    <Ui.Grid cols="2" min="sm">
      <Ui.Code tabs={["Admin login", "Device token"]} onTabChange={setTab}>
        <Ui.Code.Pre variant="shell" copy>
          <T t="prompt">$</T> <T t="cmd">curl</T> <T t="flag">-H</T> <T t="str">{AUTH[tab]}</T>{" \\\n    "}
          <T t="flag">-d</T> <T t="str">{`'{"op":"status"}'`}</T>{" \\\n    "}
          <T t="url">http://192.168.1.114/api</T>
        </Ui.Code.Pre>
      </Ui.Code>
      <Ui.Code.Pre variant="json" copy>
        {"{\n  "}<T t="key">"id"</T>{": "}<T t="str">"7c1e"</T>{",\n  "}
        <T t="key">"code"</T>{": "}<T t="num">202</T>{",\n  "}
        <T t="key">"ok"</T>{": "}<T t="bool">true</T>{",\n  "}
        <T t="key">"detail"</T>{": "}<T t="str">"flashed ota_1 · rebooting"</T>{"\n}"}
      </Ui.Code.Pre>
    </Ui.Grid>
  );
}

const TruncateDemo = () => (
  <Ui.Stack gap="1" style={{ maxWidth: 320 }}>
    <Ui.Truncate tip="console-with-a-very-long-service-name-that-does-not-fit">console-with-a-very-long-service-name-that-does-not-fit</Ui.Truncate>
    <Ui.Truncate expand tip="click to expand">ghcr.io/example/app:2026.10.13-fork-amd64-with-a-tag-this-long-expands-on-click</Ui.Truncate>
  </Ui.Stack>
);

const AlertDemo = () => (
  <Ui.Stack gap="2">
    <Ui.Alert tone="info" role="status" icon="bi-info-circle" dismissible><b>Sync scheduled.</b> The next DNS sync runs in 30 minutes.</Ui.Alert>
    <Ui.Alert tone="success" role="status" icon="bi-check-circle"><b>12 services synced.</b> Health checks and DNS match the registry.</Ui.Alert>
    <Ui.Alert tone="warning" icon="bi-exclamation-triangle" actions={<Ui.Button size="sm" variant="warning">Open health checks</Ui.Button>}>
      <b>Health check answered slowly</b> (2.4 s). Probes keep running.
    </Ui.Alert>
    <Ui.Alert tone="danger" icon="bi-x-circle">
      <b>DNS provider rejected the record.</b> Quota exceeded for this zone — the DNS entry was not created, the container is up.
      <div className="t-alert-actions"><Ui.Button size="sm" variant="danger">Retry</Ui.Button><Ui.Button size="sm" variant="ghost">View log</Ui.Button></div>
    </Ui.Alert>
    <Ui.Alert tone="neutral" size="sm" role={undefined} icon="bi-sun">Neutral flash: compact, one line.</Ui.Alert>
  </Ui.Stack>
);

const TOASTS = { success: "Saved and synced to health checks", warning: "Saved, DNS sync pending", danger: "DNS provider rejected the record: quota exceeded", info: "Next sync in 30 minutes" } as const;

function ToastDemo() {
  const { toast } = useToasts();
  return (
    <Ui.Stack gap="2">
      <Ui.Cluster gap="2">
        <Ui.Button size="sm" tone="success" onClick={() => toast("success", TOASTS.success)}>Success</Ui.Button>
        <Ui.Button size="sm" variant="warning" onClick={() => toast("warning", TOASTS.warning)}>Warning</Ui.Button>
        <Ui.Button size="sm" variant="danger" onClick={() => toast("danger", TOASTS.danger)}>Error</Ui.Button>
        <Ui.Button size="sm" onClick={() => toast("info", TOASTS.info)}>Info</Ui.Button>
      </Ui.Cluster>
      <Ui.Cluster gap="2">
        <Ui.Toast tone="success" style={{ animation: "none" }}>{TOASTS.success}</Ui.Toast>
        <Ui.Toast tone="danger" style={{ animation: "none" }}>{TOASTS.danger}</Ui.Toast>
      </Ui.Cluster>
    </Ui.Stack>
  );
}

function DialogDemo() {
  const { toast } = useToasts();
  const [open, setOpen] = useState<string | null>(null);
  const opener = (id: string, text: string) => <Ui.Button size="sm" data-dialog-open={id} onClick={() => setOpen(id)}>{text}</Ui.Button>;
  const props = (id: string) => ({ id, open: open === id, onClose: () => setOpen(null) });
  const close = (text = "Close") => <Ui.Button data-dialog-close="">{text}</Ui.Button>;
  const note = (text: string) => <span className="t-muted t-small" style={{ marginRight: "auto" }}>{text}</span>;
  return (
    <>
      <Ui.Cluster gap="2">
        {opener("demo-dlg", "Edit dialog")}{opener("demo-dlg-lg", "Large")}{opener("demo-dlg-sm", "Small")}{opener("demo-dlg-xl", "Extra large")}
      </Ui.Cluster>
      <Ui.Dialog {...props("demo-dlg-xl")} size="xl" title="Preview" footer={<>{note("xl: media, wide tables")}{close()}</>}>
        <Ui.Card.Thumb><svg viewBox="0 0 160 90" aria-hidden="true"><rect width="160" height="90" fill="var(--t-selection)" /><circle cx="80" cy="45" r="24" fill="var(--t-accent)" /></svg></Ui.Card.Thumb>
      </Ui.Dialog>
      <Ui.Dialog
        {...props("demo-dlg")} title="Edit service"
        onClose={(v) => { setOpen(null); if (v === "save") toast("success", "Saved"); }}
        footer={<>{close("Cancel")}<Ui.Button variant="primary" data-dialog-close="save">Save</Ui.Button></>}
      >
        <Ui.Field label="Subdomain" id="d-sub" hint="Pre-filled from the card's data-* attributes."><Ui.Input defaultValue="render" /></Ui.Field>
      </Ui.Dialog>
      <Ui.Dialog {...props("demo-dlg-lg")} size="lg" title="Compose file" footer={<>{note("Large + scrollable body")}{close()}</>}>
        <Ui.Code.Pre variant="json">{"services:\n  render:\n    image: example/render:2025.08\n    ports: [\"8080:80\"]\n    restart: unless-stopped"}</Ui.Code.Pre>
      </Ui.Dialog>
      <Ui.Dialog {...props("demo-dlg-sm")} size="sm" title="Rename" footer={<>{close("Cancel")}<Ui.Button variant="primary" data-dialog-close="save">Save</Ui.Button></>}>
        <Ui.Input defaultValue="render" aria-label="Name" />
      </Ui.Dialog>
    </>
  );
}

function ConfirmDemo() {
  const { toast } = useToasts();
  const [which, setWhich] = useState<"danger" | "neutral" | null>(null);
  // after closing, the dialog keeps its last content (the HTML Tailor.confirm fills one #t-confirm the same way)
  const [last, setLast] = useState<"danger" | "neutral" | null>(null);
  const show = last ?? which;
  const ask = (w: "danger" | "neutral") => { setWhich(w); setLast(w); };
  return (
    <>
      <Ui.Cluster gap="2">
        <Ui.Button size="sm" variant="danger" onClick={() => ask("danger")}>🗑 Delete…</Ui.Button>
        <Ui.Button size="sm" onClick={() => ask("neutral")}>↻ Reboot… (neutral)</Ui.Button>
      </Ui.Cluster>
      <Ui.Confirm
        open={which !== null}
        title={show === null ? undefined : show === "danger" ? "Delete service?" : "Reboot epaper-display?"}
        label={show === null ? undefined : show === "danger" ? "Delete" : "Reboot"}
        danger={show !== "neutral"}
        onResult={(ok) => {
          setWhich(null);
          if (which === "danger") { if (ok) toast("success", "render deleted"); }
          else toast(ok ? "success" : "info", ok ? "Reboot sent" : "Cancelled");
        }}
      >
        {show === "danger" && <>Removes the container, folder, DNS route and health check for <code>render</code>. This cannot be undone.</>}
        {show === "neutral" && "The screen goes blank for about 20 seconds."}
      </Ui.Confirm>
    </>
  );
}

const ProgressDemo = () => (
  <Ui.Stack gap="2" style={{ maxWidth: 420 }}>
    <Ui.Progress value={62} size="sm" />
    <Ui.Progress value={38} size="lg" tone="warning" label="38 %" />
    <Ui.Progress stacked size="sm" aria-label="Fleet state">
      <Ui.Progress.Bar tone="success" value={55} tip="running 55 %" />
      <Ui.Progress.Bar tone="warning" value={20} tip="degraded 20 %" />
      <Ui.Progress.Bar tone="danger" value={15} tip="stopped 15 %" />
    </Ui.Progress>
  </Ui.Stack>
);

const SpinnerDemo = () => (
  <Ui.Cluster gap="3" align="center">
    <Ui.Spinner size="sm" />
    <Ui.Spinner />
    <Ui.Spinner size="lg" tone="accent" />
    <span className="t-muted t-small"><Ui.Spinner size="sm" label={null} /> Loading services…</span>
  </Ui.Cluster>
);

/** Component id → island (every tier-1 component). */
export const islands: Record<string, ReactNode> = {
  "app-shell": <AppShellDemo />, navbar: <NavbarDemo />, sidebar: <SidebarDemo />, footer: <FooterDemo />,
  page: <PageDemo />,
  section: <Ui.Section title="Connection" bodyClassName="t-muted">Section body text sits under the rule.</Ui.Section>,
  toolbar: <ToolbarDemo />, grid: <GridDemo />, stack: <StackDemo />, split: <SplitDemo />,
  button: <ButtonDemo />, "button-group": <ButtonGroupDemo />, segmented: <SegmentedDemo />, menu: <MenuDemo />,
  tabs: <TabsDemo />, breadcrumb: <BreadcrumbDemo />, pagination: <PaginationDemo />, list: <ListDemo />,
  field: <FieldDemo />, check: <CheckDemo />, "duration-input": <DurationDemo />, "settings-row": <SettingsDemo />,
  badge: <BadgeDemo />, counter: <CounterDemo />, chip: <ChipDemo />, "state-label": <StateLabelDemo />,
  "status-dot": <StatusDotDemo />, avatar: <AvatarDemo />, table: <TableDemo />, card: <CardDemo />,
  "empty-state": <EmptyStateDemo />, timeline: <TimelineDemo />, "relative-time": <RelativeTimeDemo />,
  tooltip: <TooltipDemo />, "help-popover": <HelpPopoverDemo />, "code-block": <CodeBlockDemo />,
  truncate: <TruncateDemo />, alert: <AlertDemo />, toast: <ToastDemo />, dialog: <DialogDemo />,
  confirm: <ConfirmDemo />, progress: <ProgressDemo />, spinner: <SpinnerDemo />,
};

export const islandsByKit: Record<"react", Record<string, ReactNode>> = { react: islands };
