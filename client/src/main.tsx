import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// App.tsx now contains all the necessary providers
createRoot(document.getElementById("root")!).render(
  <App />
);
