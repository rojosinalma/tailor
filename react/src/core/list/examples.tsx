import { more } from "@tailor/core/glyphs.gen";
import { defineExamples } from "../../examples";
import { Glyph } from "../../glyph";
import { Badge } from "../badge/badge";
import { Button } from "../button/button";
import { Cluster } from "../cluster/cluster";
import { Icon } from "../icon/icon";
import { StatusDot } from "../status-dot/status-dot";
import { List, ListItem } from "./list";

export default defineExamples("list", [
  {
    id: "records",
    title: "Hosts with values",
    render: () => (
      <List label="Hosts">
        <ListItem
          leading={<Icon name="bi:hdd-stack" />}
          title="nas"
          description="12 services · 1.8 TB used of 4 TB"
          trailing={<StatusDot tone="success" label="Online" showLabel />}
        />
        <ListItem
          leading={<Icon name="bi:server" />}
          title="web-1"
          description="4 services"
          trailing={<StatusDot tone="warning" label="High load" showLabel />}
        />
        <ListItem
          leading={<Icon name="bi:pc-display" />}
          title="backup-host-in-the-second-building-with-a-very-long-name.example.com"
          description="A long description wraps to at most two lines. Nightly backups of every volume on nas and web-1, kept for thirty days, then moved to cold storage at example.com."
          trailing={<StatusDot tone="neutral" label="Offline" showLabel />}
        />
      </List>
    ),
  },
  {
    id: "links",
    title: "Links with a selected row",
    note: "The whole row is the link. The button at the end stays clickable on its own.",
    render: () => (
      <List label="Services">
        <ListItem
          to="#web-1"
          leading={<Icon name="bi:globe" />}
          title="web-1"
          description="nginx:1.27 on nas"
          selected
          trailing={
            <Cluster gap="2">
              <Badge tone="success">Running</Badge>
              <Button variant="ghost" size="sm" icon={<Glyph body={more} />} label="Actions for web-1" />
            </Cluster>
          }
        />
        <ListItem
          to="#api"
          leading={<Icon name="bi:braces" />}
          title="api"
          description="example/api:3.4.1 on nas"
          trailing={
            <Cluster gap="2">
              <Badge tone="warning">Degraded</Badge>
              <Button variant="ghost" size="sm" icon={<Glyph body={more} />} label="Actions for api" />
            </Cluster>
          }
        />
        <ListItem
          to="#db"
          leading={<Icon name="bi:database" />}
          title="db"
          description="postgres:17 on web-1"
          trailing={
            <Cluster gap="2">
              <Badge tone="success">Running</Badge>
              <Button variant="ghost" size="sm" icon={<Glyph body={more} />} label="Actions for db" />
            </Cluster>
          }
        />
      </List>
    ),
  },
  {
    id: "narrow",
    title: "In a narrow box",
    note: "Long titles cut to one line; the end part keeps its size.",
    width: "sm",
    render: () => (
      <List label="Services in a narrow box">
        <ListItem
          to="#web-1"
          leading={<Icon name="bi:globe" />}
          title="web-1"
          description="nginx:1.27 on nas"
          selected
          trailing={
            <Cluster gap="2">
              <Badge tone="success">Running</Badge>
              <Button variant="ghost" size="sm" icon={<Glyph body={more} />} label="Actions for web-1" />
            </Cluster>
          }
        />
        <ListItem
          to="#api"
          leading={<Icon name="bi:braces" />}
          title="api-gateway-for-the-second-building"
          description="example/api:3.4.1 on nas"
          trailing={
            <Cluster gap="2">
              <Badge tone="warning">Degraded</Badge>
              <Button variant="ghost" size="sm" icon={<Glyph body={more} />} label="Actions for api" />
            </Cluster>
          }
        />
        <ListItem
          to="#db"
          leading={<Icon name="bi:database" />}
          title="db"
          description="postgres:17 on web-1"
          trailing={
            <Cluster gap="2">
              <Badge tone="success">Running</Badge>
              <Button variant="ghost" size="sm" icon={<Glyph body={more} />} label="Actions for db" />
            </Cluster>
          }
        />
      </List>
    ),
  },
  {
    id: "plain",
    title: "Without dividers",
    render: () => (
      <List label="People" dividers={false}>
        <ListItem leading={<Icon name="bi:person-circle" />} title="alice" description="Admin" />
        <ListItem leading={<Icon name="bi:person-circle" />} title="bob" description="Viewer" />
      </List>
    ),
  },
]);
