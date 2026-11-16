import { IconSprite } from "@tailor/react/core/icon/icon";
import { createRoot } from "react-dom/client";
import { EntrySections } from "./entry-sections";
import { EXAMPLES } from "./examples.gen";
import site from "./site.gen.json";

/** The React kit's entry page: the examples of the component named in the address, and nothing else. */
const params = new URLSearchParams(location.search);
const id = params.get("id") ?? "";
const load = EXAMPLES[id];
const root = document.getElementById("root");
// ?embed=1 drops the page's own title and padding, for a view inside a frame.
if (params.get("embed")) document.body.classList.add("sc-embed");

if (root && load) {
  const { default: set } = await load();
  createRoot(root).render(
    <IconSprite href="tailor/icons.svg">
      <EntrySections
        set={set}
        title={site.components.find((c) => c.id === id)?.name ?? id}
        only={params.get("example")}
      />
    </IconSprite>,
  );
  document.title = `${id} · tailor`;
} else if (root) {
  root.textContent = `No component named "${id}".`;
}
