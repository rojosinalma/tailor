import { useState } from "react";
import { Button } from "../../core/button/button";
import { Card } from "../../core/card/card";
import { Stack } from "../../core/stack/stack";
import { Toolbar } from "../../core/toolbar/toolbar";
import { defineExamples } from "../../examples";
import { Tour, type TourStep, useTour } from "./tour";

/** A small screen to tour; every id starts with the example id, so the examples never share one. */
function Screen({ id }: { id: string }) {
  return (
    <Stack gap="3">
      <Toolbar
        start={
          <Button id={`${id}-search`} variant="ghost">
            Search hosts
          </Button>
        }
        end={
          <>
            <Button id={`${id}-settings`}>Settings</Button>
            <Button id={`${id}-add`} variant="primary">
              Add host
            </Button>
          </>
        }
      />
      <Card title="web-1" description="Serves example.com.">
        <p id={`${id}-status`}>Last check passed at 12:00.</p>
      </Card>
    </Stack>
  );
}

const stepsFor = (id: string): TourStep[] => [
  { target: `${id}-search`, title: "Search", text: "Find a host by its name or address." },
  {
    target: `${id}-add`,
    title: "Add a host",
    text: "Adds a machine to watch. It shows up in the list at once.",
  },
  {
    target: `#${id}-status`,
    title: "Status",
    text: "The result of the last check of each host.",
    side: "top",
  },
  {
    target: `${id}-settings`,
    title: "Settings",
    text: "Check times, alerts and who can see the hosts.",
    side: "left",
  },
];

function Demo({ id, steps }: { id: string; steps: readonly TourStep[] }) {
  const tour = useTour();
  const [result, setResult] = useState("The tour has not run yet.");
  return (
    <Stack gap="3">
      <Screen id={id} />
      <div>
        <Button onClick={tour.start}>Take the tour</Button>
      </div>
      <p aria-live="polite">{result}</p>
      <Tour
        steps={steps}
        {...tour}
        label="Hosts tour"
        onFinish={() => setResult("The tour is done.")}
        onSkip={() => setResult("The tour was skipped.")}
      />
    </Stack>
  );
}

export default defineExamples("tour", [
  {
    id: "basic",
    title: "A tour started from a button",
    note: "Next and Back, or the arrow keys, move between steps; Skip or Escape ends the tour. The focus goes back to the button.",
    render: () => <Demo id="basic" steps={stepsFor("basic")} />,
  },
  {
    id: "missing",
    title: "A step whose element is missing",
    note: "The second step points at nothing, so the tour passes over it.",
    render: () => (
      <Demo
        id="missing"
        steps={[
          stepsFor("missing")[0] as TourStep,
          { target: "missing-nothing", title: "Gone", text: "This element is not on the page." },
          ...stepsFor("missing").slice(1),
        ]}
      />
    ),
  },
  {
    id: "narrow",
    title: "In a narrow box",
    width: "sm",
    render: () => <Demo id="narrow" steps={stepsFor("narrow")} />,
  },
]);
