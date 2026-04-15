import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { AdminProvider } from "./context/AdminContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { LanguageProvider } from "./context/LanguageContext";
import "./index.css"; // make sure Tailwind styles are loaded

// 🔇 Disable console logs in production
if (process.env.NODE_ENV === "production") {
  const noop = () => {};
  // Save original console error and warn for critical messages
  const originalError = console.error;
  const originalWarn = console.warn;
  
  // Replace all console methods
  Object.keys(console).forEach(key => {
    console[key] = noop;
  });
  
  // Restore error and warn for critical messages
  console.error = originalError;
  console.warn = originalWarn;
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <AdminProvider>
            <FavoritesProvider>
              <App />
            </FavoritesProvider>
          </AdminProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>
);
