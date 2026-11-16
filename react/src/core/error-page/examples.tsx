import { useState } from "react";
import { defineExamples } from "../../examples";
import { Alert } from "../alert/alert";
import { ErrorPage, routeErrorComponent } from "./error-page";

const RouteError = routeErrorComponent;

/** A route that fails once: Try again resets it and it loads. */
function RetryDemo() {
  const [failed, setFailed] = useState(true);
  if (!failed) return <Alert tone="success">The hosts loaded on the second try.</Alert>;
  return (
    <RouteError
      error={new Error("GET /api/hosts failed: 503 Service Unavailable")}
      reset={() => setFailed(false)}
    />
  );
}

export default defineExamples("error-page", [
  {
    id: "default",
    title: "Default",
    note: "Without onRetry, Try again reloads the page.",
    display: "frame",
    render: () => <ErrorPage />,
  },
  {
    id: "details",
    title: "With details",
    note: "The error message or a reference, closed until asked for, with a copy button.",
    display: "frame",
    render: () => (
      <ErrorPage
        title="The hosts could not load"
        text="The server did not answer. Try again in a moment."
        details="Reference: req_7c41f0e2 (2026-11-15 11:58 UTC)"
      />
    ),
  },
  {
    id: "route-error",
    title: "As a route error boundary",
    note: "routeErrorComponent gets the error and reset from the router.",
    display: "frame",
    render: () => <RetryDemo />,
  },
  {
    id: "narrow",
    title: "Narrow",
    display: "frame",
    width: "sm",
    render: () => <ErrorPage details="TypeError: Cannot read properties of undefined (reading 'name')" />,
  },
]);
