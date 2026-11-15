import { arrowLeft } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import { type ReactNode, useEffect, useRef } from "react";
import { Glyph } from "../../glyph";
import { useIsStatic } from "../../kit";
import { Button } from "../button/button";

export interface ListDetailProps {
  list: ReactNode;
  detail: ReactNode;
  /**
   * A detail is open. In a narrow space only the detail then shows, with a back button.
   * Give the list items that open a detail the attribute data-t-detail-open for the HTML kit.
   */
  detailOpen: boolean;
  /** The back button was pressed: close the detail. */
  onBack: () => void;
  /** The accessible name of the list region. */
  listLabel: string;
  /** The accessible name of the detail region. */
  detailLabel: string;
}

const visible = (element: HTMLElement | null): element is HTMLElement =>
  element?.isConnected === true && element.getClientRects().length > 0;

/** A list beside a detail view; in a narrow space the one or the other. */
export function ListDetail({ list, detail, detailOpen, onBack, listLabel, detailLabel }: ListDetailProps) {
  const isStatic = useIsStatic();
  const back = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const before = useRef(detailOpen);

  // In the narrow form one view replaces the other: move the focus so it is never lost.
  useEffect(() => {
    if (before.current === detailOpen) return;
    before.current = detailOpen;
    if (detailOpen) {
      const active = document.activeElement;
      opener.current = active instanceof HTMLElement && listRef.current?.contains(active) ? active : null;
      if (visible(back.current)) back.current.focus();
    } else if (visible(opener.current)) {
      opener.current.focus();
    }
  }, [detailOpen]);

  return (
    <div
      className="t-list-detail"
      data-t={isStatic ? "list-detail" : undefined}
      data-detail-open={detailOpen ? "" : undefined}
    >
      <section className="t-list-detail-list" aria-label={listLabel} ref={listRef}>
        {list}
      </section>
      <section className="t-list-detail-detail" aria-label={detailLabel}>
        <Button
          ref={back}
          className="t-list-detail-back"
          variant="ghost"
          icon={<Glyph body={arrowLeft} />}
          onClick={onBack}
        >
          {t("back")}
        </Button>
        {detail}
      </section>
    </div>
  );
}
