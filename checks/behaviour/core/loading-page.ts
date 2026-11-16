import { behaviour } from "../../src/behaviour";

export default behaviour("loading-page", {
  "it is a busy status named by its heading": async ({ example, expect }) => {
    for (const id of ["spinner", "skeleton"]) {
      const status = example(id).getByRole("status");
      await expect(status).toHaveAttribute("aria-busy", "true");
      await expect(status.getByRole("heading", { level: 1 })).toHaveText("Loading");
    }
  },
  "it shows after its delay": async ({ example, expect }) => {
    await expect(example("label").getByRole("status")).toHaveCSS("opacity", "1");
  },
});
