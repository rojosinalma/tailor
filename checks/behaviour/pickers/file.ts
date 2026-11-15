import type { Locator } from "playwright";
import { behaviour } from "../../src/behaviour";

const text = (name: string, size = 10, mimeType = "text/plain") => ({
  name,
  mimeType,
  buffer: Buffer.alloc(size, "a"),
});
const sent = (input: Locator) =>
  input.evaluate((el) => [...((el as HTMLInputElement).files ?? [])].map((f) => f.name));

export default behaviour("file", {
  "a chosen file shows in the list and stays in the form": async ({ example, expect }) => {
    const body = example("default");
    const input = body.locator('input[name="config"]');
    await input.setInputFiles(text("web-1.conf", 1500));
    const item = body.getByRole("listitem");
    await expect(item).toContainText("web-1.conf");
    await expect(item).toContainText("1.5 kB");
    await expect.poll(() => sent(input)).toEqual(["web-1.conf"]);
    await input.setInputFiles(text("nas.conf"));
    await expect(body.getByRole("listitem")).toHaveCount(1);
    await expect.poll(() => sent(input)).toEqual(["nas.conf"]);
  },
  "the button opens the file dialog, also from the keyboard": async ({ page, example, expect }) => {
    const body = example("default");
    // The dialog is the operating system's: the test sees the click on the native input that opens it.
    await body.locator('input[name="config"]').evaluate((input) => {
      input.addEventListener("click", (event) => {
        event.preventDefault();
        input.setAttribute("data-opened", String(Number(input.getAttribute("data-opened") ?? 0) + 1));
      });
    });
    const button = body.getByRole("button", { name: "Choose a file" });
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(body.locator('input[name="config"]')).toHaveAttribute("data-opened", "1");
    await button.click();
    await expect(body.locator('input[name="config"]')).toHaveAttribute("data-opened", "2");
  },
  "several files join, and the limits refuse with a reason": async ({ example, expect }) => {
    const body = example("multiple");
    const input = body.locator('input[name="attachments"]');
    await input.setInputFiles([text("a.pdf", 10, "application/pdf"), text("b.txt")]);
    await input.setInputFiles([
      text("photo.png", 10, "image/png"),
      text("big.pdf", 2_000_000, "application/pdf"),
      text("c.txt"),
      text("d.txt"),
    ]);
    await expect(body.getByRole("listitem")).toHaveCount(3);
    await expect.poll(() => sent(input)).toEqual(["a.pdf", "b.txt", "c.txt"]);
    await expect(body).toContainText("photo.png: is not an accepted file type");
    await expect(body).toContainText("big.pdf: is larger than 1 MB");
    await expect(body).toContainText("d.txt: not added, the limit is 3");
  },
  "a remove button takes a file out and moves the focus on": async ({ page, example, expect }) => {
    const body = example("multiple");
    const input = body.locator('input[name="attachments"]');
    await input.setInputFiles([text("a.txt"), text("b.txt")]);
    await body.getByRole("button", { name: "Remove a.txt" }).click();
    await expect(body.getByRole("listitem")).toHaveCount(1);
    await expect.poll(() => sent(input)).toEqual(["b.txt"]);
    await expect(body.getByRole("button", { name: "Remove b.txt" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(body.getByRole("listitem")).toHaveCount(0);
    await expect(body.getByRole("button", { name: "Choose files" })).toBeFocused();
  },
  "dropped files are added": async ({ page, example, expect }) => {
    const body = example("multiple");
    const zone = body.getByRole("group", { name: "Attachments" });
    const transfer = await page.evaluateHandle(() => {
      const data = new DataTransfer();
      data.items.add(new File(["web-1"], "report.pdf", { type: "application/pdf" }));
      return data;
    });
    await zone.dispatchEvent("dragover", { dataTransfer: transfer });
    await expect(zone).toHaveAttribute("data-dragging", "");
    await zone.dispatchEvent("drop", { dataTransfer: transfer });
    await expect(zone).not.toHaveAttribute("data-dragging", "");
    await expect(body.getByRole("listitem")).toContainText("report.pdf");
    await expect.poll(() => sent(body.locator('input[name="attachments"]'))).toEqual(["report.pdf"]);
  },
  "a disabled picker takes no files": async ({ example, expect }) => {
    await expect(example("disabled").getByRole("button", { name: "Choose a file" })).toBeDisabled();
  },
  "on a phone the list fits the width": async ({ page, example, expect }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    const body = example("multiple");
    await body
      .locator('input[name="attachments"]')
      .setInputFiles(text("a-very-long-file-name-of-the-nightly-backup-of-nas-and-web-1.txt"));
    await expect(body.getByRole("listitem")).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  },
});
