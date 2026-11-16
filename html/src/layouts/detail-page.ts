/**
 * The page's own code for the detail page in the HTML kit: the actions answer by their data-id, as an
 * app's script would. The core script provides Tailor.confirm and Tailor.toast.
 */
import { once } from "../runtime";

type Toast = (tone: "success" | "info", message: string) => void;
type Confirm = (options: {
  title: string;
  text?: string;
  confirmLabel?: string;
  danger?: boolean;
}) => Promise<boolean>;

const toast: Toast = (tone, message) => {
  const show = window.Tailor?.toast;
  if (typeof show === "function") (show as Toast)(tone, message);
};

const DELETE_TEXT = "The service stops and its settings go away for good. Its logs stay for 30 days.";

once("detail-page", () => {
  document.addEventListener("click", async (event) => {
    const action = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-id]") : null;
    // A menu item sits in a popup outside the page: its trigger tells which page it belongs to.
    const menu = action?.closest(".t-menu");
    const from = menu ? document.querySelector(`[data-t-menu="${menu.id}"]`) : action;
    const page = from?.closest(".t-page");
    const name = page?.querySelector(".t-page-title")?.textContent ?? "";
    if (!action || !page) return;
    if (action.dataset.id === "restart-service") toast("info", `${name} restarts.`);
    if (action.dataset.id === "stop-service") toast("info", `${name} stops.`);
    if (action.dataset.id !== "delete-service") return;
    const ask = window.Tailor?.confirm;
    if (typeof ask !== "function") return;
    const sure = await (ask as Confirm)({
      title: `Delete ${name}?`,
      text: DELETE_TEXT,
      confirmLabel: "Delete",
      danger: true,
    });
    if (sure) toast("success", `${name} is deleted.`);
  });
});
