import { more } from "@tailor/core/glyphs.gen";
import { defineExamples } from "../../examples";
import { Glyph } from "../../glyph";
import { Button } from "../button/button";
import { Icon } from "../icon/icon";
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
          trailing="99.9 %"
        />
        <ListItem
          leading={<Icon name="bi:server" />}
          title="web-1"
          description="4 services"
          trailing="97.2 %"
        />
        <ListItem
          leading={<Icon name="bi:pc-display" />}
          title="backup-host-in-the-second-building-with-a-very-long-name.example.com"
          description="A long description wraps to at most two lines. Nightly backups of every volume on nas and web-1, kept for thirty days, then moved to cold storage at example.com."
          trailing="—"
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
            <Button variant="ghost" size="sm" icon={<Glyph body={more} />} label="Actions for web-1" />
          }
        />
        <ListItem
          to="#api"
          leading={<Icon name="bi:braces" />}
          title="api"
          description="example/api:3.4.1 on nas"
          trailing={<Button variant="ghost" size="sm" icon={<Glyph body={more} />} label="Actions for api" />}
        />
        <ListItem
          to="#db"
          leading={<Icon name="bi:database" />}
          title="db"
          description="postgres:17 on web-1"
          trailing={<Button variant="ghost" size="sm" icon={<Glyph body={more} />} label="Actions for db" />}
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
