import { ConfirmRegion } from "../../core/confirm/confirm";
import { ToastRegion } from "../../core/toast/toast";
import { defineExamples } from "../../examples";
import { SettingsPageLayout } from "./settings-page";

export default defineExamples("settings-page", [
  {
    id: "default",
    title: "The settings of a console",
    note: "Each change saves by itself. The name admin is refused, so the failed state shows; its button tries again.",
    display: "frame",
    render: () => (
      <>
        <ToastRegion />
        <ConfirmRegion />
        <SettingsPageLayout />
      </>
    ),
  },
  {
    id: "narrow",
    title: "On a phone",
    note: "The sections become a row of links above the settings.",
    display: "frame",
    width: "sm",
    render: () => <SettingsPageLayout />,
  },
]);
