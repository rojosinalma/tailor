import { check } from "@tailor/core/glyphs.gen";
import { t } from "@tailor/core/text";
import type spec from "@tailor/packs/core/stepper/spec";
import { Glyph } from "../../glyph";
import { AppLink } from "../../link";

export interface StepItem {
  /** Unique within the stepper. */
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  /** The address of the step. Only a done step becomes a link, so the user can go back to it. */
  readonly to?: string;
}

export interface StepperProps {
  steps: readonly StepItem[];
  /** The id of the current step. The steps before it are done. */
  current: string;
  orientation?: (typeof spec.props.orientation)[number];
}

/** The steps of a process and where the user is. */
export function Stepper({ steps, current, orientation = "horizontal" }: StepperProps) {
  const at = steps.findIndex((step) => step.id === current);
  return (
    <div className="t-stepper" data-orientation={orientation === "horizontal" ? undefined : orientation}>
      <ol className="t-stepper-list">
        {steps.map((step, index) => {
          const state = index < at ? "done" : index === at ? "current" : "upcoming";
          return (
            <li
              key={step.id}
              className="t-stepper-step"
              data-state={state}
              aria-current={state === "current" ? "step" : undefined}
            >
              <span className="t-stepper-marker">
                {state === "done" ? <Glyph body={check} label={t("stepDone")} /> : index + 1}
              </span>
              <span className="t-stepper-text">
                <span className="t-stepper-label">
                  {state === "done" && step.to ? <AppLink to={step.to}>{step.label}</AppLink> : step.label}
                </span>
                {step.description ? <span className="t-stepper-description">{step.description}</span> : null}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
