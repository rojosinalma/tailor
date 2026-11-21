<!-- kit: react -->

Use the React kit.

A log viewer for one service, "api" on host web-1. It shows the lines of the log with their time and level
(debug, info, warning, error); some lines are very long, such as stack traces and request URLs. I want to
search the lines, show only some levels, pause and resume the live view, and download what I see. New lines
arrive every second while it is not paused. Start with about 500 lines.

There is no server: make the lines up in the page.
