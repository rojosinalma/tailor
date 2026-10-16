import { Ui, useToasts, useConfirm, UiProvider } from "tailor-react";

function Demo() {
  const { toast } = useToasts();
  const confirm = useConfirm();
  return (
    <Ui.Page>
      <Ui.Page.Header>
        <Ui.Page.Title>tailor-react demo</Ui.Page.Title>
        <Ui.Page.Lead>bootstrap skin · dracula palette</Ui.Page.Lead>
        <Ui.Page.Actions>
          <Ui.Button variant="primary" onClick={() => toast("success", "Saved and synced")}>Toast</Ui.Button>
          <Ui.Button
            variant="ghost"
            tone="danger"
            onClick={() => { void confirm("Delete service?", "This cannot be undone."); }}
          >
            Confirm…
          </Ui.Button>
        </Ui.Page.Actions>
      </Ui.Page.Header>

      <Ui.Section title="Actions">
        <Ui.Cluster gap="2" align="center">
          <Ui.Button variant="primary">Save</Ui.Button>
          <Ui.Button>Cancel</Ui.Button>
          <Ui.Button variant="ghost" tone="danger">Delete</Ui.Button>
          <Ui.Button iconOnly aria-label="Edit" tip="Edit"><Ui.Icon>✎</Ui.Icon></Ui.Button>
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
          <Ui.Segmented
            label="View"
            defaultValue="cards"
            options={[{ value: "cards", label: "Cards" }, { value: "table", label: "Table" }]}
          />
          <Ui.Menu trigger="Filter ▾">
            <Ui.Menu.Header>Show</Ui.Menu.Header>
            <Ui.Menu.Item checked>Running</Ui.Menu.Item>
            <Ui.Menu.Item checked={false}>Stopped</Ui.Menu.Item>
            <Ui.Menu.Divider />
            <Ui.Menu.Item tone="danger">Delete…</Ui.Menu.Item>
          </Ui.Menu>
        </Ui.Cluster>
      </Ui.Section>

      <Ui.Section title="Indicators">
        <Ui.Cluster gap="2" align="center">
          <Ui.Badge tone="success">running</Ui.Badge>
          <Ui.Badge tone="neutral">stopped</Ui.Badge>
          <Ui.Badge tone="warning" variant="solid">Update</Ui.Badge>
          <Ui.Chip tone="info" onRemove={() => {}} removeLabel="Remove host:web-1">host:web-1</Ui.Chip>
          <Ui.StateLabel state="open" icon="◉">Open</Ui.StateLabel>
          <Ui.StateLabel state="done" variant="solid" icon="✓">Deployed</Ui.StateLabel>
          <Ui.Dot status="running" title="running" />
          <Ui.Avatar tone="purple">AL</Ui.Avatar>
          <Ui.Spinner size="sm" />
          <Ui.RelativeTime datetime={new Date(Date.now() - 3600_000).toISOString()} />
        </Ui.Cluster>
        <Ui.Stack gap="2">
          <Ui.Progress value={62} />
          <Ui.Progress stacked size="sm">
            <Ui.Progress.Bar tone="success" value={55} />
            <Ui.Progress.Bar tone="warning" value={20} />
            <Ui.Progress.Bar tone="danger" value={15} />
          </Ui.Progress>
        </Ui.Stack>
      </Ui.Section>

      <Ui.Section title="Tabs & table">
        <Ui.Tabs
          variant="underline"
          defaultValue="open"
          tabs={[
            { value: "open", label: <>Open <Ui.Counter>24</Ui.Counter></> },
            { value: "closed", label: <>Closed <Ui.Counter>180</Ui.Counter></> },
          ]}
          panels={{
            open: (
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
                    <tr>
                      <Ui.Table.Td icon><Ui.Dot status="running" /></Ui.Table.Td>
                      <td>console</td>
                      <Ui.Table.Td num>12 %</Ui.Table.Td>
                      <td><Ui.Badge tone="success">running</Ui.Badge></td>
                      <Ui.Table.Td actions><Ui.Button size="sm" iconOnly tip="Restart" aria-label="Restart">↻</Ui.Button></Ui.Table.Td>
                    </tr>
                    <tr>
                      <Ui.Table.Td icon><Ui.Dot status="stopped" /></Ui.Table.Td>
                      <td>render</td>
                      <Ui.Table.Td num>0 %</Ui.Table.Td>
                      <td><Ui.Badge tone="neutral">stopped</Ui.Badge></td>
                      <Ui.Table.Td actions><Ui.Button size="sm" iconOnly tip="Start" aria-label="Start">▶</Ui.Button></Ui.Table.Td>
                    </tr>
                  </tbody>
                </Ui.Table>
              </Ui.Table.Wrap>
            ),
            closed: <Ui.EmptyState icon="▭" title="Nothing closed yet"><p>Closed items show up here.</p></Ui.EmptyState>,
          }}
        />
      </Ui.Section>

      <Ui.Section title="Forms">
        <Ui.Grid cols="2">
          <Ui.Stack gap="3">
            <Ui.Field label="Hostname" id="host" hint="The LAN name, without scheme.">
              <Ui.Input placeholder="example.internal" />
            </Ui.Field>
            <Ui.Field label="Port" id="port" error="Must be between 1 and 65535.">
              <Ui.Input defaultValue="99999" />
            </Ui.Field>
            <Ui.CheckGroup legend="Notify on">
              <Ui.Check defaultChecked label="Failure" desc="Any job that exits non-zero." />
              <Ui.Check label="Recovery" />
            </Ui.CheckGroup>
            <Ui.Check switch defaultChecked label="Protected" />
          </Ui.Stack>
          <Ui.Stack gap="3">
            <Ui.Settings>
              <Ui.SettingsRow
                label="Device name"
                htmlFor="s-name"
                setting="name"
                help={{ tone: "info", label: "About device name", children: <p>Shown in every list and toast.</p> }}
                save={(key, value) => Promise.resolve({ ok: true, message: `${key} = ${value} ✓` })}
              >
                <Ui.Input size="sm" id="s-name" defaultValue="epaper-display" />
              </Ui.SettingsRow>
            </Ui.Settings>
            <Ui.Alert tone="warning" icon="▲" onDismiss={() => {}}>
              <b>Health check answered slowly</b> (2.4 s). Probes keep running.
            </Ui.Alert>
            <Ui.Card>
              <Ui.Card.Header>
                <Ui.Card.Title><Ui.Icon>▣</Ui.Icon>render</Ui.Card.Title>
                <Ui.Dot status="running" />
              </Ui.Card.Header>
              <Ui.Card.Body>Renders 3D models on demand.</Ui.Card.Body>
              <Ui.Card.Footer actions><Ui.Button size="sm">Reboot</Ui.Button></Ui.Card.Footer>
            </Ui.Card>
          </Ui.Stack>
        </Ui.Grid>
      </Ui.Section>
    </Ui.Page>
  );
}

export function App() {
  return (
    <UiProvider>
      <Demo />
    </UiProvider>
  );
}
