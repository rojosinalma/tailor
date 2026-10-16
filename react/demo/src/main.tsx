// Load order per core/conventions.md §1: tokens → base → layout → skin → palette.
import "../../../core/tokens.css";
import "../../../core/base.css";
import "../../../core/layout.css";
import "../../../skins/bootstrap/skin.css";
import "../../../palettes/dracula.css";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";

createRoot(document.getElementById("root")!).render(<App />);
