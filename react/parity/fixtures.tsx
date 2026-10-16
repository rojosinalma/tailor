// Parity fixtures: for every tier-1 component in core/components.json, the Ui.*
// recreation of its canonical markup example. bin/check-parity renders each
// fixture with renderToStaticMarkup and diffs it structurally against the
// canonical snippet (classes and attributes order-insensitive).
import type { ReactNode } from "react";
import { Ui } from "../src/index.ts";

export const fixtures: Record<string, ReactNode> = {
  "app-shell": (
    <Ui.AppShell
      nav="…"
      side={<nav className="t-sidebar" aria-label="Sections">…</nav>}
      foot="…"
    >
      …
    </Ui.AppShell>
  ),

  navbar: (
    <Ui.Navbar>
      <Ui.Navbar.Brand href="/"><Ui.Icon>◆</Ui.Icon>console</Ui.Navbar.Brand>
      <Ui.Navbar.Nav>
        <Ui.Navbar.Link href="/services" current>Services</Ui.Navbar.Link>
        <Ui.Navbar.Link href="/hosts">Hosts</Ui.Navbar.Link>
      </Ui.Navbar.Nav>
      <Ui.Navbar.Sep />
      <Ui.Navbar.End>…picker…</Ui.Navbar.End>
    </Ui.Navbar>
  ),

  sidebar: (
    <Ui.Sidebar label="Sections">
      <Ui.Sidebar.Group>Overview</Ui.Sidebar.Group>
      <Ui.Sidebar.Item href="#dash" current icon={<Ui.Icon>▣</Ui.Icon>}>Dashboard</Ui.Sidebar.Item>
      <Ui.Sidebar.Item href="#alerts" icon={<Ui.Icon>▲</Ui.Icon>} trail={<Ui.Counter tone="danger">3</Ui.Counter>}>
        Alerts
      </Ui.Sidebar.Item>
      <Ui.Sidebar.Collapsible open icon={<Ui.Icon>▤</Ui.Icon>} label="Devices" trail={<Ui.Counter>12</Ui.Counter>}>
        <Ui.Sidebar.Item href="#d1" icon={<Ui.Dot status="running" />}>epaper-display</Ui.Sidebar.Item>
      </Ui.Sidebar.Collapsible>
      <Ui.Sidebar.Divider />
      <Ui.Sidebar.Item href="#settings" icon={<Ui.Icon>⚙</Ui.Icon>}>Settings</Ui.Sidebar.Item>
    </Ui.Sidebar>
  ),

  footer: (
    <Ui.Footer>
      <Ui.Footer.Repo href="https://github.com/…" title="repo"><Ui.Icon>⌥</Ui.Icon></Ui.Footer.Repo>
      <Ui.Footer.End>
        <Ui.Footer.Version>v0.9.2</Ui.Footer.Version>
        <Ui.Button variant="ghost" size="sm" {...{ "data-tailor-mode-toggle": "" }} aria-label="Toggle light/dark">☼</Ui.Button>
      </Ui.Footer.End>
    </Ui.Footer>
  ),

  page: (
    <Ui.Page>
      <Ui.Page.Header>
        <Ui.Page.Back href="/services" aria-label="Back to services" />
        <Ui.Page.Title>render</Ui.Page.Title>
        <Ui.Page.Lead>console service · web-1</Ui.Page.Lead>
        <Ui.Page.Actions><Ui.Button variant="primary">Deploy</Ui.Button></Ui.Page.Actions>
      </Ui.Page.Header>
      …
    </Ui.Page>
  ),

  section: <Ui.Section title="Connection">…</Ui.Section>,

  toolbar: (
    <Ui.Toolbar label="Table actions">
      <Ui.Button variant="primary">Save</Ui.Button>
      <Ui.Button>Cancel</Ui.Button>
      <Ui.Toolbar.Spacer />
      <Ui.Button variant="ghost" tone="danger">Delete</Ui.Button>
    </Ui.Toolbar>
  ),

  grid: (
    <Ui.Grid cols="auto" min="sm">
      <Ui.Card>…</Ui.Card>
      <Ui.Card>…</Ui.Card>
    </Ui.Grid>
  ),

  stack: (
    <Ui.Stack gap="3">
      <Ui.Cluster gap="2" align="center">…</Ui.Cluster>
      …
    </Ui.Stack>
  ),

  split: (
    <Ui.Split fill="viewport">
      <Ui.Split.Side><nav className="t-sidebar">…</nav></Ui.Split.Side>
      <Ui.Split.Pane>…</Ui.Split.Pane>
    </Ui.Split>
  ),

  button: (
    <>
      <Ui.Button variant="primary">Save</Ui.Button>
      <Ui.Button>Cancel</Ui.Button>
      <Ui.Button variant="ghost" tone="danger">Delete</Ui.Button>
      <Ui.Button iconOnly aria-label="Edit"><Ui.Icon>✎</Ui.Icon></Ui.Button>
    </>
  ),

  "button-group": (
    <>
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
    </>
  ),

  segmented: (
    <Ui.Segmented
      label="View"
      name="view"
      defaultValue="cards"
      options={[
        { value: "cards", label: "Cards" },
        { value: "table", label: "Table" },
        { value: "list", label: "List", disabled: true },
      ]}
    />
  ),

  menu: (
    <Ui.Menu trigger="Filter ▾" align="start">
      <Ui.Menu.Header>Show</Ui.Menu.Header>
      <Ui.Menu.Item checked>Running</Ui.Menu.Item>
      <Ui.Menu.Item checked={false}>Stopped</Ui.Menu.Item>
      <Ui.Menu.Divider />
      <Ui.Menu.Item tone="danger">Delete…</Ui.Menu.Item>
    </Ui.Menu>
  ),

  tabs: (
    <Ui.Tabs
      variant="underline"
      defaultValue="open"
      tabs={[
        { value: "open", label: <>Open <Ui.Counter>24</Ui.Counter></> },
        { value: "closed", label: <>Closed <Ui.Counter>180</Ui.Counter></> },
      ]}
      panels={{ open: "…", closed: "…" }}
    />
  ),

  breadcrumb: (
    <Ui.Breadcrumb>
      <Ui.Breadcrumb.Item href="/">Home</Ui.Breadcrumb.Item>
      <Ui.Breadcrumb.Item href="/services">Services</Ui.Breadcrumb.Item>
      <Ui.Breadcrumb.Item current>render</Ui.Breadcrumb.Item>
    </Ui.Breadcrumb>
  ),

  pagination: (
    <Ui.Pagination size="sm">
      <Ui.Pagination.Link disabled>«</Ui.Pagination.Link>
      <Ui.Pagination.Link href="?p=1" current>1</Ui.Pagination.Link>
      <Ui.Pagination.Link href="?p=2">2</Ui.Pagination.Link>
      <Ui.Pagination.Link disabled>…</Ui.Pagination.Link>
      <Ui.Pagination.Link href="?p=12">12</Ui.Pagination.Link>
      <Ui.Pagination.Link href="?p=2">»</Ui.Pagination.Link>
    </Ui.Pagination>
  ),

  list: (
    <Ui.List label="Host" defaultSelected={["web-1"]}>
      <Ui.List.Group>Hosts</Ui.List.Group>
      <Ui.List.Item value="web-1" lead="▤" name="web-1" desc="192.168.1.20 · 24 services" trail="primary" />
      <Ui.List.Item value="nas" lead="▤" name="nas" trail={<Ui.Badge className="t-list-trail" tone="success">online</Ui.Badge>} />
      <Ui.List.Divider />
      <Ui.List.Item value="add" lead="＋" name="Add a host" desc="needs the admin role" disabled />
    </Ui.List>
  ),

  field: (
    <>
      <Ui.Field label="Hostname" id="host" hint="The LAN name, without scheme.">
        <Ui.Input placeholder="example.internal" />
      </Ui.Field>
      <Ui.Field label="Port" id="port" error="Must be between 1 and 65535.">
        <Ui.Input defaultValue="99999" />
      </Ui.Field>
      <Ui.Field label="Token" id="tok">
        <Ui.InputGroup>
          <Ui.InputAddon>🔑</Ui.InputAddon>
          <Ui.Input id="tok" type="password" defaultValue="secret" />
          <Ui.Button type="button" tip="Show">👁</Ui.Button>
        </Ui.InputGroup>
      </Ui.Field>
    </>
  ),

  check: (
    <>
      <Ui.CheckGroup legend="Notify on">
        <Ui.Check defaultChecked label="Failure" desc="Any job that exits non-zero." />
        <Ui.Check label="Recovery" />
      </Ui.CheckGroup>
      <Ui.Check switch defaultChecked label="Protected" />
    </>
  ),

  "duration-input": (
    <Ui.DurationInput setting="offline_after_s" value={900} id="offline" label="Offline after" />
  ),

  "settings-row": (
    <Ui.Settings>
      <Ui.SettingsRow
        label="Device name"
        htmlFor="s-name"
        setting="name"
        help={{
          tone: "info",
          label: "About device name",
          children: <p>Shown in every list and toast. Defaults to the hostname.</p>,
        }}
      >
        <Ui.Input size="sm" id="s-name" defaultValue="epaper-display" />
      </Ui.SettingsRow>
    </Ui.Settings>
  ),

  badge: (
    <>
      <Ui.Badge tone="success">running</Ui.Badge>
      <Ui.Badge tone="neutral">stopped</Ui.Badge>
      <Ui.Badge tone="warning" variant="solid">Update</Ui.Badge>
    </>
  ),

  counter: (
    <>
      Issues <Ui.Counter>24</Ui.Counter>  Failing <Ui.Counter tone="danger">3</Ui.Counter>
    </>
  ),

  chip: (
    <>
      <Ui.Chip tone="success"><Ui.Icon>▤</Ui.Icon>web-1</Ui.Chip>
      <Ui.Chip tone="info" onRemove={() => {}} removeLabel="Remove host:web-1">host:web-1 </Ui.Chip>
    </>
  ),

  "state-label": (
    <>
      <Ui.StateLabel state="open" icon="◉">Open</Ui.StateLabel>
      <Ui.StateLabel state="done" variant="solid" icon="✓">Deployed</Ui.StateLabel>
    </>
  ),

  "status-dot": <Ui.Dot status="running" title="running" />,

  avatar: (
    <>
      <Ui.Avatar tone="purple">AL</Ui.Avatar>
      <Ui.Avatar size="lg" src="…" />
      <Ui.Avatar tone="cyan" status="online">TM</Ui.Avatar>
      <Ui.Avatar.Stack>
        <Ui.Avatar tone="purple">AL</Ui.Avatar>
        <Ui.Avatar tone="green">TM</Ui.Avatar>
        <Ui.Avatar more>+3</Ui.Avatar>
      </Ui.Avatar.Stack>
      <Ui.Avatar.Row name="alice" desc="owner"><Ui.Avatar tone="green">AL</Ui.Avatar></Ui.Avatar.Row>
    </>
  ),

  table: (
    <Ui.Table.Wrap>
      <Ui.Table variant="data">
        <thead>
          <tr>
            <Ui.Table.Th icon></Ui.Table.Th>
            <Ui.Table.Th sort="name" dir="ascending">Name</Ui.Table.Th>
            <Ui.Table.Th num sort="cpu">CPU</Ui.Table.Th>
            <th>State</th>
            <Ui.Table.Th actions>Actions</Ui.Table.Th>
          </tr>
        </thead>
        <tbody>
          <Ui.Table.Group colSpan={5}>Custom</Ui.Table.Group>
          <tr>
            <Ui.Table.Td icon><Ui.Dot status="running" /></Ui.Table.Td>
            <td>console</td>
            <Ui.Table.Td num>12 %</Ui.Table.Td>
            <td><Ui.Badge tone="success">running</Ui.Badge></td>
            <Ui.Table.Td actions>
              <Ui.Button size="sm" iconOnly tip="Restart">↻</Ui.Button>
            </Ui.Table.Td>
          </tr>
        </tbody>
      </Ui.Table>
    </Ui.Table.Wrap>
  ),

  card: (
    <>
      <Ui.Card>
        <Ui.Card.Header>
          <Ui.Card.Title><Ui.Icon>▣</Ui.Icon>render</Ui.Card.Title>
          <Ui.Dot status="running" />
        </Ui.Card.Header>
        <Ui.Card.Body>…</Ui.Card.Body>
        <Ui.Card.Footer actions><Ui.Button size="sm">Reboot</Ui.Button></Ui.Card.Footer>
      </Ui.Card>
      <Ui.Card collapsible open>
        <Ui.Card.Header>
          <Ui.Card.Title>Self-hosted <Ui.Counter>3</Ui.Counter></Ui.Card.Title>
        </Ui.Card.Header>
        <Ui.Card.Body>…</Ui.Card.Body>
      </Ui.Card>
    </>
  ),

  "empty-state": (
    <Ui.EmptyState icon="▭" title="No services yet" actions={<Ui.Button variant="primary">New service</Ui.Button>}>
      <p>Register the first one and it shows up here with its health.</p>
    </Ui.EmptyState>
  ),

  timeline: (
    <Ui.Timeline>
      <Ui.Timeline.Item tone="success" badge="＋">
        <b>alice</b> created the service <Ui.RelativeTime datetime="2026-10-11T10:00:00Z" />
      </Ui.Timeline.Item>
      <Ui.Timeline.Item condensed tone="accent" badge="⑂">
        <code>a1b2c3d</code> fix: tunnel order
      </Ui.Timeline.Item>
      <Ui.Timeline.Break />
      <Ui.Timeline.Item tone="accent" solid badge="🚀">
        <b>console</b> deployed <b>v0.9.2</b>
      </Ui.Timeline.Item>
    </Ui.Timeline>
  ),

  "relative-time": (
    <Ui.RelativeTime datetime="2026-10-13T14:02:09Z">13 Oct 2026, 16:02</Ui.RelativeTime>
  ),

  tooltip: (
    <Ui.Button iconOnly tip="Edit" tipAt="bottom"><Ui.Icon>✎</Ui.Icon></Ui.Button>
  ),

  "help-popover": (
    <Ui.Help tone="info" label="About heartbeat">
      <p>The broker publishes this on the device's behalf when its connection drops.</p>
    </Ui.Help>
  ),

  "code-block": (
    <>
      <Ui.Code tabs={["Admin login", "Device token"]}>
        <Ui.Code.Pre variant="shell" copy>
          <Ui.Code.Tok t="prompt">$</Ui.Code.Tok> <Ui.Code.Tok t="cmd">curl</Ui.Code.Tok>{" "}
          <Ui.Code.Tok t="flag">-H</Ui.Code.Tok> <Ui.Code.Tok t="str">'Authorization: Basic …'</Ui.Code.Tok>{" "}
          <Ui.Code.Tok t="url">http://192.168.1.114/api</Ui.Code.Tok>
        </Ui.Code.Pre>
        <Ui.Code.Pre variant="shell">…</Ui.Code.Pre>
      </Ui.Code>
      <Ui.Code.Pre variant="json">
        {"{ "}<Ui.Code.Tok t="key">"ok"</Ui.Code.Tok>{": "}<Ui.Code.Tok t="bool">true</Ui.Code.Tok>
        {", "}<Ui.Code.Tok t="key">"code"</Ui.Code.Tok>{": "}<Ui.Code.Tok t="num">202</Ui.Code.Tok>{" }"}
      </Ui.Code.Pre>
    </>
  ),

  truncate: (
    <>
      <Ui.Truncate title="console-with-a-very-long-service-name">console-with-a-very-long-service-name</Ui.Truncate>
      <Ui.Truncate expand title="click to expand">ghcr.io/example/app:2026.10.13-fork-amd64-with-a-tag-this-long</Ui.Truncate>
    </>
  ),

  alert: (
    <Ui.Alert tone="warning" icon="▲" actions={<Ui.Button size="sm">Open health checks</Ui.Button>} onDismiss={() => {}}>
      <b>Health check answered slowly</b> (2.4 s). Probes keep running.
    </Ui.Alert>
  ),

  toast: (
    <>
      <Ui.ToastRegion />
      <Ui.Toast tone="success">Saved and synced to health checks</Ui.Toast>
    </>
  ),

  dialog: (
    <>
      <Ui.Button {...{ "data-dialog-open": "edit-dlg" }}>Edit</Ui.Button>
      <Ui.Dialog
        id="edit-dlg"
        title="Edit service"
        footer={
          <>
            <Ui.Button {...{ "data-dialog-close": "" }}>Cancel</Ui.Button>
            <Ui.Button variant="primary" {...{ "data-dialog-close": "save" }}>Save</Ui.Button>
          </>
        }
      >
        <Ui.Field label="Subdomain" id="d-sub">
          <Ui.Input defaultValue="render" />
        </Ui.Field>
      </Ui.Dialog>
    </>
  ),

  confirm: <Ui.Confirm />,

  progress: (
    <>
      <Ui.Progress value={62} />
      <Ui.Progress stacked size="sm">
        <Ui.Progress.Bar tone="success" value={55} tip="running 55 %" />
        <Ui.Progress.Bar tone="warning" value={20} />
        <Ui.Progress.Bar tone="danger" value={15} />
      </Ui.Progress>
    </>
  ),

  spinner: (
    <>
      <Ui.Spinner />
      <span className="t-muted"><Ui.Spinner size="sm" label={null} /> Loading services…</span>
    </>
  ),
};
