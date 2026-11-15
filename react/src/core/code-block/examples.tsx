import { defineExamples } from "../../examples";
import { CodeBlock } from "./code-block";

const compose = `services:
  web-1:
    image: nginx:1.27
    ports:
      - "8080:80"
    volumes:
      - ./site:/usr/share/nginx/html:ro
    restart: unless-stopped`;

const command =
  "curl --fail --silent --show-error --header 'Accept: application/json' https://example.com/api/v1/hosts/nas/services?include=status,image,updated";

export default defineExamples("code-block", [
  {
    id: "titled",
    title: "With a title",
    render: () => <CodeBlock title="compose.yaml" code={compose} />,
  },
  {
    id: "scroll",
    title: "A long line scrolls sideways",
    note: "The code takes the focus, so the arrow keys can scroll it.",
    render: () => <CodeBlock code={command} label="Request for the services of nas" />,
  },
  {
    id: "wrap",
    title: "A long line wraps",
    render: () => <CodeBlock code={command} wrap />,
  },
]);
