import { defineComponent } from "@tailor/core/spec";

export default defineComponent({
  id: "settings-page",
  name: "Settings page",
  pack: "layouts",
  group: "layouts",
  description:
    "The settings of an app, to copy: the Settings of the forms pack in a fill Page at a readable width, with sections of text, choice, switch, duration and number settings that save themselves, a token with reveal and copy, and a danger zone at the end that asks first. The sample save fails for the name admin, so the failed state can be seen. HTML kit: each row saves to its saveUrl.",
  root: "t-page",
  html: "markup",
});
