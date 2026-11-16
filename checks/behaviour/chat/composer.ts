import { behaviour } from "../../src/behaviour";

export default behaviour("composer", {
  "Enter sends, Shift+Enter makes a new line": async ({ page, example, expect }) => {
    const body = example("default");
    const box = body.getByRole("textbox", { name: "Message" });
    await box.click();
    await page.keyboard.type("first line");
    await page.keyboard.press("Shift+Enter");
    await page.keyboard.type("second line");
    await expect(box).toHaveValue("first line\nsecond line");
    await page.keyboard.press("Enter");
    await expect(body.getByText("Sent: first line\nsecond line")).toBeVisible();
    await expect(box).toHaveValue("");
    await expect(box).toBeFocused();
  },
  "Enter during IME composition never sends": async ({ example, expect }) => {
    const body = example("default");
    const box = body.getByRole("textbox", { name: "Message" });
    await box.fill("にほん");
    await box.dispatchEvent("keydown", { key: "Enter", isComposing: true, bubbles: true });
    await expect(body.getByText("Nothing sent yet")).toBeVisible();
    await expect(box).toHaveValue("にほん");
  },
  "empty text cannot be sent": async ({ example, expect }) => {
    const body = example("default");
    const box = body.getByRole("textbox", { name: "Message" });
    const send = body.getByRole("button", { name: "Send" });
    await expect(send).toHaveAttribute("aria-disabled", "true");
    await box.fill("   ");
    await box.press("Enter");
    await send.click({ force: true });
    await expect(body.getByText("Nothing sent yet")).toBeVisible();
    await box.fill("hello");
    await expect(send).not.toHaveAttribute("aria-disabled", /./);
    await send.click();
    await expect(body.getByText("Sent: hello")).toBeVisible();
  },
  "files are added from the chooser and by paste, and removed": async ({ page, example, expect }) => {
    const body = example("attachments");
    const chooser = page.waitForEvent("filechooser");
    await body.getByRole("button", { name: "Attach files" }).click();
    await (await chooser).setFiles([
      { name: "web-1.log", mimeType: "text/plain", buffer: Buffer.from("ok") },
      { name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("skip") },
    ]);
    const files = body.getByRole("list", { name: "Attachments" });
    await expect(files.getByRole("listitem")).toHaveCount(1);
    await expect(files).toContainText("web-1.log");
    const box = body.getByRole("textbox", { name: "Message with files" });
    await box.evaluate((el) => {
      const data = new DataTransfer();
      data.items.add(new File(["png"], "screen.png", { type: "image/png" }));
      el.dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
    });
    await expect(files.getByRole("listitem")).toHaveCount(2);
    await body.getByRole("button", { name: "Remove web-1.log" }).click();
    await expect(files.getByRole("listitem")).toHaveCount(1);
    await expect(box).toBeFocused();
    await body.getByRole("button", { name: "Send" }).click();
    await expect(body.getByText("Sent: (no text) with screen.png")).toBeVisible();
    await expect(body.getByRole("list", { name: "Attachments" })).toHaveCount(0);
  },
  "busy: the send button becomes a stop button": async ({ example, expect }) => {
    const body = example("busy");
    const box = body.getByRole("textbox", { name: "Reply" });
    await box.fill("wait");
    await box.press("Enter");
    await expect(box).toHaveValue("wait");
    await expect(body.getByRole("button", { name: "Send" })).toHaveCount(0);
    await body.getByRole("button", { name: "Stop" }).click();
    await expect(body.getByText("Stopped")).toBeVisible();
    await expect(body.getByRole("button", { name: "Send" })).toBeVisible();
  },
  "the character count shows near the limit": async ({ example, expect }) => {
    const body = example("limit");
    const box = body.getByRole("textbox", { name: "Short note" });
    await expect(box).toHaveAccessibleDescription(/of 200 characters/);
    await box.fill("short");
    await expect(body.getByText(/of 200 characters/)).toHaveCount(0);
  },
  "a disabled composer takes no input": async ({ example, expect }) => {
    const body = example("disabled");
    await expect(body.getByRole("textbox", { name: "Closed conversation" })).toBeDisabled();
    await expect(body.getByRole("button", { name: "Send" })).toBeDisabled();
  },
});
