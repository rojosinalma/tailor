import { arrowLeft } from "@tailor/core/glyphs.gen";
import { defineExamples } from "../../examples";
import { Glyph } from "../../glyph";
import { ButtonLink } from "../button/button";
import { NotFoundPage } from "./not-found";

export default defineExamples("not-found", [
  {
    id: "default",
    title: "Default",
    display: "frame",
    render: () => <NotFoundPage />,
  },
  {
    id: "actions",
    title: "Own text and a second action",
    note: "In React a Back button can call history.back(); in the HTML kit the server sets a link.",
    display: "frame",
    render: () => (
      <NotFoundPage
        title="Host not found"
        text="No host is called “web-9”. It may have been removed."
        homeTo="/dashboard"
        actions={
          <ButtonLink to="#hosts" icon={<Glyph body={arrowLeft} />}>
            All hosts
          </ButtonLink>
        }
      />
    ),
  },
  {
    id: "narrow",
    title: "Narrow",
    display: "frame",
    width: "sm",
    render: () => <NotFoundPage actions={<ButtonLink to="#hosts">All hosts</ButtonLink>} />,
  },
]);
