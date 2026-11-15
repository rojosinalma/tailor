/** Serves a folder as a static site, for the browser checks and for a look at the showcase. */
import { join, normalize } from "node:path";
import { at } from "./paths";

export function serve(folder = "showcase/dist", port = 0): { url: string; stop: () => void } {
  const root = at(folder);
  const server = Bun.serve({
    port,
    hostname: "127.0.0.1",
    async fetch(request) {
      const { pathname } = new URL(request.url);
      const path = normalize(join(root, decodeURIComponent(pathname)));
      if (!path.startsWith(root)) return new Response("Not found", { status: 404 });
      for (const candidate of [path, join(path, "index.html")]) {
        const file = Bun.file(candidate);
        if (await file.exists()) return new Response(file, { headers: { "Cache-Control": "no-store" } });
      }
      return new Response("Not found", { status: 404 });
    },
  });
  return { url: `http://127.0.0.1:${server.port}/`, stop: () => server.stop(true) };
}

if (import.meta.main) {
  const { url } = serve(process.argv[2] ?? "showcase/dist", Number(process.env.PORT ?? 4173));
  console.log(`Serving at ${url}`);
}
