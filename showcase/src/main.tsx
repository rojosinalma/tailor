/** The showcase app: every shell and component of tailor, in every skin, palette and mode, in both kits. */
import { IconSprite } from "@tailor/react/core/icon/icon";
import { ThemeProvider } from "@tailor/react/core/theme-pickers/theme-pickers";
import { PwaProvider } from "@tailor/react/pwa/pwa/provider";
import { RouterProvider } from "@tanstack/react-router";
import { createRoot } from "react-dom/client";
import { THEME } from "./app/data";
import { router } from "./app/router";
import { adoptAddressTheme } from "./app/state";

adoptAddressTheme();

const root = document.getElementById("root");
if (root)
  createRoot(root).render(
    <ThemeProvider config={THEME}>
      <IconSprite href="tailor/icons.svg">
        {/* The site is an installable app that opens with no network: the pwa pack, used on itself. */}
        <PwaProvider worker="sw.js">
          <RouterProvider router={router} />
        </PwaProvider>
      </IconSprite>
    </ThemeProvider>,
  );
