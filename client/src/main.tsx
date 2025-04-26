import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext";
import { SoundProvider } from "./contexts/SoundContext";

createRoot(document.getElementById("root")!).render(
  <SoundProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </SoundProvider>
);
