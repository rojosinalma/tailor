import { defineExamples } from "../../examples";
import { DiffView } from "./diff-view";

const before = `[server]
host = web-1
port = 80
workers = 2

[log]
level = info
path = /var/log/app.log
`;

const after = `[server]
host = web-1
port = 8080
workers = 4
timeout = 30

[log]
level = warn
path = /var/log/app.log
`;

const patch = `diff --git a/compose.yaml b/compose.yaml
--- a/compose.yaml
+++ b/compose.yaml
@@ -1,6 +1,6 @@
 services:
   web-1:
-    image: nginx:1.26
+    image: nginx:1.27
     ports:
       - "8080:80"
     restart: unless-stopped
diff --git a/.env.example b/.env.example
--- a/.env.example
+++ b/.env.example
@@ -1,2 +1,3 @@
 TZ=UTC
 LOG_LEVEL=info
+ADMIN_EMAIL=alice@example.com
`;

const long = Array.from({ length: 30 }, (_, i) => `line ${i + 1}`).join("\n");
const longChanged = long.replace("line 15", "line 15 changed").replace("line 3\n", "");

const command =
  "ExecStart=/usr/bin/app --config /etc/app/app.ini --listen 0.0.0.0:8080 --log-level info --metrics";

export default defineExamples("diff-view", [
  {
    id: "unified",
    title: "Two texts, unified",
    render: () => <DiffView title="app.ini" before={before} after={after} />,
  },
  {
    id: "split",
    title: "Side by side",
    note: "In a narrow box it falls back to the unified view.",
    render: () => <DiffView title="app.ini" before={before} after={after} mode="split" />,
  },
  {
    id: "patch",
    title: "A unified diff of two files",
    render: () => <DiffView title="Update web-1" patch={patch} />,
  },
  {
    id: "context",
    title: "One line of context",
    render: () => <DiffView title="lines.txt" before={long} after={longChanged} context={1} />,
  },
  {
    id: "scroll",
    title: "A long line scrolls sideways",
    note: "The lines take the focus, so the arrow keys can scroll them.",
    render: () => (
      <DiffView
        title="app.service"
        before={command}
        after={command.replace("info", "warn").replace("--metrics", "--metrics --metrics-port 9100")}
      />
    ),
  },
  {
    id: "none",
    title: "No changes",
    render: () => <DiffView title="app.ini" before={before} after={before} />,
  },
  {
    id: "narrow",
    title: "Side by side in a narrow box",
    width: "sm",
    render: () => <DiffView title="app.ini" before={before} after={after} mode="split" />,
  },
]);
