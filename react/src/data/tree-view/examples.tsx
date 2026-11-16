import { more } from "@tailor/core/glyphs.gen";
import { useState } from "react";
import { Button } from "../../core/button/button";
import { Icon } from "../../core/icon/icon";
import { defineExamples } from "../../examples";
import { Glyph } from "../../glyph";
import { type TreeNode, TreeView } from "./tree-view";

const folder = <Icon name="bi:folder" />;
const file = <Icon name="bi:file-earmark-code" />;
const text = <Icon name="bi:file-earmark-text" />;

/** A file tree: a node per path, with fixed names. */
const dir = (path: string, names: readonly (string | TreeNode)[]): TreeNode => ({
  id: path,
  label: path.split("/").pop() ?? path,
  icon: folder,
  children: names.map((name) =>
    typeof name === "string"
      ? { id: `${path}/${name}`, label: name, icon: name.endsWith(".md") ? text : file }
      : name,
  ),
});

const files: TreeNode[] = [
  dir("src", [
    dir("src/components", ["button.tsx", "dialog.tsx", "menu.tsx", "table.tsx"]),
    dir("src/lib", ["api.ts", "auth.ts", "db.ts"]),
    "app.tsx",
    "main.tsx",
  ]),
  dir("docs", ["install.md", "deploy.md", "a-guide-with-a-rather-long-file-name-for-narrow-boxes.md"]),
  { id: "package.json", label: "package.json", icon: file },
  { id: "README.md", label: "README.md", icon: text },
];

const sites: TreeNode[] = [
  {
    id: "home",
    label: "Home",
    counter: 3,
    children: [
      { id: "nas", label: "nas", counter: 1 },
      { id: "web-1", label: "web-1", counter: 2 },
      { id: "printer", label: "printer", disabled: true },
    ],
  },
  {
    id: "office",
    label: "Office",
    children: [
      { id: "web-2", label: "web-2" },
      { id: "db-1", label: "db-1" },
    ],
  },
];

const guide: TreeNode[] = [
  {
    id: "start",
    label: "Getting started",
    children: [
      { id: "install", label: "Install", to: "#install" },
      { id: "first-steps", label: "First steps", to: "#first-steps" },
    ],
  },
  { id: "faq", label: "Questions", to: "#faq" },
];

function Lazy() {
  const [nodes, setNodes] = useState<TreeNode[]>([
    { id: "archive", label: "archive", icon: folder, hasChildren: true },
    { id: "notes.md", label: "notes.md", icon: text },
  ]);
  const load = (id: string): void => {
    // A stand-in for a request.
    setTimeout(
      () =>
        setNodes((current) =>
          current.map((n) =>
            n.id === id
              ? {
                  ...n,
                  children: ["2024.tar", "2025.tar"].map((name) => ({
                    id: `${id}/${name}`,
                    label: name,
                    icon: file,
                  })),
                }
              : n,
          ),
        ),
      400,
    );
  };
  return <TreeView label="Archive" nodes={nodes} onLoadChildren={load} />;
}

export default defineExamples("tree-view", [
  {
    id: "default",
    title: "Files",
    note: "Arrow keys move, open and close; Enter and Space select; typing a name jumps to it. The selected item shows its actions.",
    render: () => (
      <TreeView
        label="Files"
        nodes={files}
        defaultExpanded={["src", "src/lib"]}
        defaultSelected={["src/lib/api.ts"]}
        renderActions={(node) => (
          <Button
            size="sm"
            variant="ghost"
            icon={<Glyph body={more} />}
            label={`Actions for ${node.label}`}
          />
        )}
      />
    ),
  },
  {
    id: "multiple",
    title: "Several selected, with counters and a disabled item",
    render: () => (
      <TreeView
        label="Hosts"
        nodes={sites}
        multiple
        defaultExpanded={["home", "office"]}
        defaultSelected={["nas", "web-2"]}
      />
    ),
  },
  {
    id: "links",
    title: "Links",
    note: "A label can be a link: Enter follows it.",
    render: () => <TreeView label="Guide" nodes={guide} defaultExpanded={["start"]} />,
  },
  {
    id: "narrow",
    title: "In a narrow box",
    width: "sm",
    render: () => <TreeView label="Narrow files" nodes={files} defaultExpanded={["docs"]} />,
  },
  {
    id: "lazy",
    title: "Children that load on open",
    note: "React kit: onLoadChildren loads the children of a branch the first time it opens.",
    render: () => <Lazy />,
  },
]);
