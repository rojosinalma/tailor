import { defineExamples } from "../../examples";
import { Markdown } from "./markdown";

/** A small chart as a data: SVG, so the example loads no file. */
const chart = `data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='320' height='120' viewBox='0 0 320 120'><rect width='320' height='120' fill='lightsteelblue'/><path d='M0 100 L60 70 L120 80 L180 40 L240 55 L320 20' fill='none' stroke='steelblue' stroke-width='4'/></svg>",
)}`;

const guide = `## Moving web-1 to another host

A service runs on one host at a time. To move **web-1** from \`nas\` to a new host, stop it, copy its
volumes and start it again. See [the host guide](https://example.com/docs/hosts) or the [steps](#steps) below.

### Before you start

- The new host is online and has enough disk space.
- You have a recent backup of the volumes.
- ~~Ask for a maintenance window~~ (not needed for a static site).

### Steps

1. Stop the service.
2. Copy the volumes with \`rsync\`.
3. Start the service on the new host.

\`\`\`sh
rsync -a --info=progress2 /srv/web-1/ new-host:/srv/web-1/
ssh new-host 'docker compose -f /srv/web-1/compose.yaml up -d'
\`\`\`

> Keep the old copy for a week. A move that looks fine can still miss a file that only a monthly job uses.

### Volumes

| Volume | Size | Note |
|---|---:|---|
| site | 120 MB | Static files |
| logs | 2.4 GB | Can stay behind |

### Checklist

- [x] Backup made
- [x] New host online
- [ ] Health check passes on the new host
- [ ] Old copy removed after a week

![Requests per minute after the move](${chart})
`;

const comment =
  "Looks good to me. One question: does `web-1` need a restart after the change? See https://example.com/docs/restart.";

const unsafe = `Only the safe parts of this text stay.

<script>window.tailorUnsafe = "script"</script>
<img src="${chart}" alt="Chart" onload="window.tailorUnsafe = 'onload'" onerror="window.tailorUnsafe = 'onerror'">

[A script link](javascript:window.tailorUnsafe='link') and <a href="data:text/html,<script>alert(1)</script>">a data link</a>.

<iframe src="https://example.com/"></iframe>

<p style="position: fixed; inset: 0">A paragraph with an inline style.</p>

<form action="https://example.com/"><input name="q" aria-label="Query"><button>Send</button></form>

<div data-t="dialog" id="main" class="t-dialog">Text that tries to look like a dialog.</div>
`;

export default defineExamples("markdown", [
  {
    id: "document",
    title: "A document",
    render: () => <Markdown source={guide} label="Moving web-1" />,
  },
  {
    id: "comment",
    title: "A short comment",
    render: () => <Markdown source={comment} />,
  },
  {
    id: "unsafe",
    title: "Unsafe HTML is removed",
    note: "Scripts, event handlers, script and data links, frames, inline styles, forms and foreign classes do not reach the page.",
    render: () => <Markdown source={unsafe} />,
  },
  {
    id: "narrow",
    title: "In a narrow box",
    width: "sm",
    render: () => <Markdown source={guide} />,
  },
]);
