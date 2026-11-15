import { chevronDown, copy, external, more, retry } from "@tailor/core/glyphs.gen";
import { useState } from "react";
import { defineExamples } from "../../examples";
import { Glyph } from "../../glyph";
import { Button } from "../button/button";
import { Cluster } from "../cluster/cluster";
import { Icon } from "../icon/icon";
import { Menu, type MenuItem } from "./menu";

const actions: readonly MenuItem[] = [
  { id: "restart", label: "Restart", icon: <Glyph body={retry} />, shortcut: "Ctrl+R" },
  { id: "copy", label: "Copy address", icon: <Glyph body={copy} /> },
  { id: "docs", label: "Open docs", icon: <Glyph body={external} />, to: "https://example.com/docs" },
  { type: "separator" },
  { id: "stop", label: "Stop", icon: <Icon name="bi:stop-circle" />, disabled: true },
  { id: "delete", label: "Delete service", icon: <Icon name="bi:trash" />, tone: "danger" },
];

function ViewMenu() {
  const [columns, setColumns] = useState({ status: true, uptime: false });
  const [sort, setSort] = useState("name");
  return (
    <Menu
      trigger={<Button>View</Button>}
      label="View options"
      items={[
        {
          type: "group",
          label: "Columns",
          items: [
            {
              type: "checkbox",
              id: "status",
              label: "Status",
              checked: columns.status,
              onCheckedChange: (checked) => setColumns({ ...columns, status: checked }),
            },
            {
              type: "checkbox",
              id: "uptime",
              label: "Uptime",
              checked: columns.uptime,
              onCheckedChange: (checked) => setColumns({ ...columns, uptime: checked }),
            },
          ],
        },
        { type: "separator" },
        {
          type: "radio-group",
          label: "Sort by",
          value: sort,
          onValueChange: setSort,
          options: [
            { value: "name", label: "Name" },
            { value: "host", label: "Host" },
            { value: "age", label: "Age" },
          ],
        },
      ]}
    />
  );
}

export default defineExamples("menu", [
  {
    id: "default",
    title: "Actions with icons, a link, a disabled and a danger item",
    render: () => (
      <Menu
        trigger={<Button icon={<Glyph body={chevronDown} />}>Actions</Button>}
        label="Service actions"
        items={actions}
      />
    ),
  },
  {
    id: "more",
    title: "From an icon button, aligned to its end",
    render: () => (
      <Cluster justify="end">
        <Menu
          trigger={<Button variant="ghost" icon={<Glyph body={more} />} label="More actions" />}
          label="More actions"
          align="end"
          items={actions}
        />
      </Cluster>
    ),
  },
  {
    id: "choices",
    title: "Checkbox items and a radio group",
    note: "A checkbox or radio item keeps the menu open.",
    render: () => <ViewMenu />,
  },
  {
    id: "long",
    title: "Long labels truncate",
    render: () => (
      <Menu
        trigger={<Button>Hosts</Button>}
        label="Hosts"
        items={[
          { id: "a", label: "web-1.example.com, the production web server in the first rack" },
          { id: "b", label: "nas.example.com" },
        ]}
      />
    ),
  },
]);
