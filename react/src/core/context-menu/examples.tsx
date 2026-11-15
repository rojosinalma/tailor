import { copy, more, retry } from "@tailor/core/glyphs.gen";
import { defineExamples } from "../../examples";
import { Glyph } from "../../glyph";
import { AppLink } from "../../link";
import { Button } from "../button/button";
import { Cluster } from "../cluster/cluster";
import { Icon } from "../icon/icon";
import type { MenuItem } from "../menu/menu";
import { Menu } from "../menu/menu";
import { Stack } from "../stack/stack";
import { ContextMenu } from "./context-menu";

const actions: readonly MenuItem[] = [
  { id: "restart", label: "Restart", icon: <Glyph body={retry} /> },
  { id: "copy", label: "Copy address", icon: <Glyph body={copy} /> },
  { type: "separator" },
  { id: "stop", label: "Stop", icon: <Icon name="bi:stop-circle" />, disabled: true },
  { id: "delete", label: "Delete host", icon: <Icon name="bi:trash" />, tone: "danger" },
];

export default defineExamples("context-menu", [
  {
    id: "default",
    title: "On an area, paired with a visible menu button",
    note: "Right click, long press, or focus the link and press Shift+F10. The button offers the same actions.",
    render: () => (
      <Cluster align="center">
        <ContextMenu label="Host actions" items={actions}>
          <Stack gap="1">
            <strong>web-1.example.com</strong>
            <span>
              Host <AppLink to="#web-1">web-1</AppLink> serves 3 services.
            </span>
          </Stack>
        </ContextMenu>
        <Menu
          trigger={<Button variant="ghost" icon={<Glyph body={more} />} label="Host actions" />}
          label="Host actions"
          align="end"
          items={actions}
        />
      </Cluster>
    ),
  },
]);
