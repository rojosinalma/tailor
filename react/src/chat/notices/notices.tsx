import type { Tone } from "@tailor/core/spec";
import { t } from "@tailor/core/text";
import type spec from "@tailor/packs/chat/notices/spec";
import type buttonSpec from "@tailor/packs/core/button/spec";
import { useEffect, useRef, useState } from "react";
import { TONE_GLYPH } from "../../core/alert/alert";
import { Button } from "../../core/button/button";
import { Glyph } from "../../glyph";

export interface NoticeAction {
  label: string;
  variant?: (typeof buttonSpec.props.variant)[number];
  onSelect: () => void;
}

export interface Notice {
  id: string;
  tone?: (typeof spec.props.tone)[number];
  title: string;
  text?: string;
  actions: readonly NoticeAction[];
}

export interface NoticesProps {
  /** The accessible name of the stack. */
  label: string;
  /** The notices, the most urgent first. */
  items: readonly Notice[];
}

/** How many notices show before the rest collapse. */
const SHOWN = 3;

/** The things that wait for an answer, above the composer. Nothing renders when there are none. */
export function Notices({ label, items }: NoticesProps) {
  const [expanded, setExpanded] = useState(false);
  const [announce, setAnnounce] = useState("");
  const known = useRef<Set<string> | null>(null);

  // A notice that arrives later is announced politely, also when it sits in the collapsed part.
  useEffect(() => {
    const ids = new Set(items.map((i) => i.id));
    const before = known.current;
    known.current = ids;
    if (!before) return;
    const added = items.filter((i) => !before.has(i.id));
    if (added.length > 0) setAnnounce(added.map((i) => i.title).join(". "));
  }, [items]);

  const hidden = items.length > SHOWN && !expanded ? items.length - SHOWN : 0;
  const shown = hidden > 0 ? items.slice(0, SHOWN) : items;

  return (
    <section className="t-notices" aria-label={label} hidden={items.length === 0}>
      <ul className="t-notices-list">
        {shown.map((item) => (
          <NoticeCard key={item.id} item={item} />
        ))}
      </ul>
      {items.length > SHOWN ? (
        <Button
          className="t-notices-more"
          variant="ghost"
          size="sm"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? t("chatFewerNotices") : t("chatMoreNotices").replace("{count}", String(hidden))}
        </Button>
      ) : null}
      <p className="t-sr-only" role="status">
        {announce}
      </p>
    </section>
  );
}

function NoticeCard({ item }: { item: Notice }) {
  const tone: Tone = item.tone ?? "info";
  return (
    <li className="t-notices-item" data-tone={tone}>
      <span className="t-notices-icon">
        <Glyph body={TONE_GLYPH[tone]} />
      </span>
      <div className="t-notices-content">
        <p className="t-notices-title">{item.title}</p>
        {item.text ? <p className="t-notices-text">{item.text}</p> : null}
      </div>
      {item.actions.length > 0 ? (
        <div className="t-notices-actions">
          {item.actions.map((action) => (
            <Button key={action.label} size="sm" variant={action.variant} onClick={action.onSelect}>
              {action.label}
            </Button>
          ))}
        </div>
      ) : null}
    </li>
  );
}
