import type { Page } from "playwright";
import { behaviour } from "../../src/behaviour";

/** The kept Query cache of the example, as OfflineData wrote it to IndexedDB. */
const kept = (page: Page): Promise<{ buster: string; queries: string[] } | null> =>
  page.evaluate(
    () =>
      new Promise((resolve) => {
        const request = indexedDB.open("tailor-offline-data", 1);
        request.onsuccess = () => {
          const get = request.result
            .transaction("clients")
            .objectStore("clients")
            .get("tailor-example-hosts");
          get.onsuccess = () => {
            const value = get.result as
              | { buster: string; clientState: { queries: { queryHash: string }[] } }
              | undefined;
            resolve(
              value
                ? { buster: value.buster, queries: value.clientState.queries.map((q) => q.queryHash) }
                : null,
            );
          };
          get.onerror = () => resolve(null);
        };
        request.onerror = () => resolve(null);
      }),
  );

export default behaviour("offline-data", {
  "keeps the loaded data in IndexedDB and shows it again after a reload": async ({
    page,
    example,
    expect,
  }) => {
    await expect(example("default").getByRole("list", { name: "Hosts" })).toContainText("web-1");
    await expect
      .poll(() => kept(page), { timeout: 5000 })
      .toEqual({ buster: "2026-11-15-1", queries: ['["hosts"]'] });
    await page.reload();
    await expect(page.getByRole("list", { name: "Hosts" })).toContainText("nas");
  },
});
