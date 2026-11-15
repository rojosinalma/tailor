import { t } from "@tailor/core/text";
import { type DiffLine, diffPatch, diffTexts, splitRows } from "@tailor/packs/code/diff-view/logic";
import type spec from "@tailor/packs/code/diff-view/spec";
import { Fragment, useMemo } from "react";

interface DiffLook {
  /** "split" shows the old and the new text side by side in a wide box, and unified in a narrow one. */
  mode?: (typeof spec.props.mode)[number];
  /** Shown above the lines, such as a file name. */
  title?: string;
}

/** Either two texts to compare, or a ready unified diff. */
export type DiffViewProps = DiffLook &
  (
    | {
        before: string;
        after: string;
        /** Lines of context around each change. */
        context?: number;
        patch?: never;
      }
    | { patch: string; before?: never; after?: never; context?: never }
  );

const SIGNS = { add: "+", remove: "−", context: " " };

function Line({ line, side }: { line?: DiffLine; side?: "old" | "new" }) {
  if (!line) {
    // The empty half of a split row, across from a line that only one side has.
    return (
      <div className="t-diff-line">
        <span className="t-diff-num" />
        <span className="t-diff-sign" />
        <span className="t-diff-text" />
      </div>
    );
  }
  return (
    <div className="t-diff-line" data-change={line.change}>
      {side !== "new" ? (
        <span className="t-diff-num" aria-hidden="true">
          {line.old}
        </span>
      ) : null}
      {side !== "old" ? (
        <span className="t-diff-num" aria-hidden="true">
          {line.new}
        </span>
      ) : null}
      <span className="t-diff-sign">{SIGNS[line.change]}</span>
      <span className="t-diff-text">{line.text}</span>
    </div>
  );
}

/** The difference between two texts, line by line. */
export function DiffView(props: DiffViewProps) {
  const { mode = "unified", title } = props;
  const model = useMemo(
    () =>
      props.patch !== undefined
        ? diffPatch(props.patch)
        : diffTexts(props.before, props.after, props.context ?? 3),
    [props.patch, props.before, props.after, props.context],
  );
  const summary = `${t(model.added === 1 ? "diffLineAdded" : "diffLinesAdded").replace("{count}", String(model.added))}, ${t("diffRemoved").replace("{count}", String(model.removed))}`;

  return (
    <div className="t-code t-diff" data-mode={mode === "unified" ? undefined : mode}>
      {title ? (
        <div className="t-code-header">
          <span className="t-code-title">{title}</span>
        </div>
      ) : null}
      {model.hunks.length === 0 ? (
        <p className="t-diff-empty">{t("diffNoChanges")}</p>
      ) : (
        <>
          <p className="t-sr-only">{summary}</p>
          {/* The lines scroll sideways, so the box takes the focus for the keyboard. */}
          <section
            className="t-diff-body"
            // biome-ignore lint/a11y/noNoninteractiveTabindex: the lines scroll sideways, so the keyboard needs to reach them.
            tabIndex={0}
            aria-label={title ?? t("diffChanges")}
          >
            <div className="t-diff-lines" data-layout="unified">
              {model.hunks.map((hunk) => (
                <Fragment key={`${hunk.file ?? ""}${hunk.header}`}>
                  <div className="t-diff-hunk">{hunk.file ? `${hunk.file} ${hunk.header}` : hunk.header}</div>
                  {hunk.lines.map((line) => (
                    <Line key={`${line.old ?? ""}-${line.new ?? ""}`} line={line} />
                  ))}
                </Fragment>
              ))}
            </div>
            {mode === "split" ? (
              <div className="t-diff-lines" data-layout="split">
                {model.hunks.map((hunk) => (
                  <Fragment key={`${hunk.file ?? ""}${hunk.header}`}>
                    <div className="t-diff-hunk">
                      {hunk.file ? `${hunk.file} ${hunk.header}` : hunk.header}
                    </div>
                    {splitRows(hunk.lines).map((row) => (
                      <div className="t-diff-row" key={`${row.left?.old ?? ""}-${row.right?.new ?? ""}`}>
                        <Line line={row.left} side="old" />
                        <Line line={row.right} side="new" />
                      </div>
                    ))}
                  </Fragment>
                ))}
              </div>
            ) : null}
          </section>
        </>
      )}
    </div>
  );
}
