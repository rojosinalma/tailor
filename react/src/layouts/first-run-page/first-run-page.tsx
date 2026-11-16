import { Button } from "../../core/button/button";
import { Card } from "../../core/card/card";
import { EmptyState } from "../../core/empty-state/empty-state";
import { Icon } from "../../core/icon/icon";
import { Page } from "../../core/page/page";
import { Section } from "../../core/section/section";
import { type StepItem, Stepper } from "../../core/stepper/stepper";
import { AddServiceDialog } from "../form-dialog/form-dialog";

// Sample data: the three steps from nothing to a running service.

export const FIRST_RUN_STEPS: readonly StepItem[] = [
  { id: "add", label: "Add a service", description: "Name it and pick the host it runs on." },
  { id: "deploy", label: "Deploy an image", description: "Push an image, or pick one from a registry." },
  { id: "watch", label: "Watch it run", description: "Health checks and alerts start by themselves." },
];

/** The services page before the first service: what is missing, what to do, and what comes after. */
export function FirstRunPageLayout() {
  return (
    // No page actions yet: the one thing to do sits in the empty state, where the eye goes.
    <Page title="Services" description="What runs on every host." width="readable">
      {/* The empty state stands where the table will be, so the page keeps its shape. */}
      <Card>
        <EmptyState
          icon={<Icon name="bi:hdd-stack" />}
          title="No services yet"
          text="A service is a program that runs on one of your hosts. Add the first one to start."
          actions={
            <AddServiceDialog
              trigger={
                <Button variant="primary" icon={<Icon name="bi:plus-lg" />}>
                  Add service
                </Button>
              }
            />
          }
        />
      </Card>

      {/* What happens after the first step, so the person knows what they start. */}
      <Section title="How it works">
        <Stepper steps={FIRST_RUN_STEPS} current="add" />
      </Section>
    </Page>
  );
}
