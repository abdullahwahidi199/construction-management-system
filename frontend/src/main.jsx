import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import "./index.css";
import App from "./App.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { AuthProvider } from "./auth/AuthContext.jsx";
import ErrorBoundary from "./components/common/ErrorBoundary.jsx";
import OfflineNotifier from "./components/common/OfflineNotifier.jsx";
import FormValidationEnhancer from "./components/common/FormValidationEnhancer.jsx";

if (import.meta.env.PROD) {
  console.log = () => {};
  console.debug = () => {};
  console.error = () => {};
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <App />
          <OfflineNotifier />
          <FormValidationEnhancer />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 5000,
              style: {
                background: "var(--card)",
                color: "var(--text)",
                border: "1px solid var(--border)",
              },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);
