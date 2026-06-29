
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import App from "./App.tsx";
import "./index.css";
import "./autofill.css";

createRoot(document.getElementById("root")!).render(
  <HashRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </HashRouter>
);
