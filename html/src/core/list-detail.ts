import { register } from "../runtime";

const visible = (element: HTMLElement | null | undefined): element is HTMLElement =>
  !!element && element.isConnected && element.getClientRects().length > 0;

/** Opens the detail from a list item marked data-t-detail-open and closes it with the back button. */
register("list-detail", (element) => {
  const list = element.querySelector<HTMLElement>(":scope > .t-list-detail-list");
  const back = element.querySelector<HTMLButtonElement>(
    ":scope > .t-list-detail-detail > .t-list-detail-back",
  );
  if (!list || !back) return;
  let opener: HTMLElement | null = null;

  list.addEventListener("click", (event) => {
    const item =
      event.target instanceof Element ? event.target.closest<HTMLElement>("[data-t-detail-open]") : null;
    if (!item || !list.contains(item)) return;
    element.setAttribute("data-detail-open", "");
    opener = item;
    if (visible(back)) back.focus();
  });

  back.addEventListener("click", () => {
    element.removeAttribute("data-detail-open");
    element.dispatchEvent(new CustomEvent("t:back", { bubbles: true }));
    if (visible(opener)) opener.focus();
  });
});
