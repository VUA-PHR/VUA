import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@vua/design-system/tokens.css";
import "@vua/design-system/base.css";
import { App } from "./App.js";
import "./app-shell.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
