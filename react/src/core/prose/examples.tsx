import { defineExamples } from "../../examples";
import { Prose } from "./prose";

// A small diagram as a data: URI, so the example loads no file: two hosts and the move between them.
const diagram = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 160">' +
    '<rect width="480" height="160" fill="hsl(210 20% 50% / 0.15)"/>' +
    '<rect x="40" y="50" width="140" height="60" rx="8" fill="hsl(210 60% 55%)"/>' +
    '<rect x="300" y="50" width="140" height="60" rx="8" fill="hsl(150 45% 45%)"/>' +
    '<path d="M190 80h96m-12-10 12 10-12 10" stroke="hsl(210 15% 55%)" stroke-width="4" fill="none"/>' +
    "</svg>",
)}`;

export default defineExamples("prose", [
  {
    id: "markdown",
    title: "Rendered Markdown",
    render: () => (
      <Prose>
        <h1>Moving a service to another host</h1>
        <p>
          A service runs on one host at a time. To move <code>web-1</code> from <code>nas</code> to a new
          host, stop it, copy its volumes, and start it on the new host. The steps below take about ten
          minutes. See <a href="https://example.com/docs/hosts">the host guide</a> for the details of each
          host.
        </p>
        <h2>Before you start</h2>
        <ul>
          <li>The new host is online and has enough disk space.</li>
          <li>
            You have a recent backup:
            <ul>
              <li>the volumes of the service,</li>
              <li>its settings file.</li>
            </ul>
          </li>
        </ul>
        <h2>Steps</h2>
        <ol>
          <li>Stop the service.</li>
          <li>
            Copy the volumes with <code>rsync</code>.
          </li>
          <li>Start the service on the new host and check its health.</li>
        </ol>
        <pre>
          <code>
            {
              "rsync -a --info=progress2 /srv/web-1/ new-host:/srv/web-1/\nssh new-host 'docker compose -f /srv/web-1/compose.yaml up -d'"
            }
          </code>
        </pre>
        <blockquote>
          <p>
            Keep the old copy for a week. A move that looks fine can still miss a file that only a monthly job
            uses.
          </p>
        </blockquote>
        <p>
          <img
            src={diagram}
            alt="The service moves from nas, on the left, to the new host, on the right."
            width={480}
            height={160}
          />
        </p>
        <h3>Sizes of the volumes</h3>
        <table>
          <thead>
            <tr>
              <th>Volume</th>
              <th>Size</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>site</td>
              <td>120 MB</td>
              <td>Static files</td>
            </tr>
            <tr>
              <td>logs</td>
              <td>2.4 GB</td>
              <td>Can be left behind</td>
            </tr>
          </tbody>
        </table>
        <hr />
        <h4>After the move</h4>
        <p>
          Change the address in the settings of every service that calls <strong>web-1</strong>.
        </p>
      </Prose>
    ),
  },
]);
