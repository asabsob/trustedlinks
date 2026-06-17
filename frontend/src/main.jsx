import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { LangProvider } from "./context/LangContext.jsx";
import { AdminAuthProvider } from "./context/AdminAuthContext.jsx";

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE || "development",
    tracesSampleRate: import.meta.env.MODE === "production" ? 0.1 : 1.0,
  });

  console.log("✅ Sentry frontend monitoring enabled");
} else {
  console.log("ℹ️ Sentry frontend monitoring disabled: VITE_SENTRY_DSN not set");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<div>Something went wrong.</div>}>
      <BrowserRouter>
        <LangProvider>
          <AdminAuthProvider>
            <App />
          </AdminAuthProvider>
        </LangProvider>
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
