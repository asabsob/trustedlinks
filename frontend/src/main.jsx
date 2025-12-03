import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { LangProvider } from "./context/LangContext.jsx";
import { AdminAuthProvider } from "./context/AdminAuthContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <LangProvider>
        <AdminAuthProvider>
          <App />
        </AdminAuthProvider>
      </LangProvider>
    </BrowserRouter>
  </React.StrictMode>
);
