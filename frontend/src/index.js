import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "App";

// Soft UI Context Provider
import { SoftUIControllerProvider } from "context";

// Import the service worker
import * as serviceWorker from "./serviceWorker";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <BrowserRouter>
    <SoftUIControllerProvider>
      <App />
    </SoftUIControllerProvider>
  </BrowserRouter>
);

// Register the service worker with update notifications
serviceWorker.register({
  onUpdate: (registration) => {
    // When a new version is available, show a notification
    const updateAvailable = window.confirm(
      "A new version of the application is available. Load the new version?"
    );

    if (updateAvailable && registration.waiting) {
      // Send a message to the waiting service worker to skip waiting
      registration.waiting.postMessage({ type: "SKIP_WAITING" });

      // Reload the page to activate the new service worker
      window.location.reload();
    }
  },
  onSuccess: (registration) => {
    console.log("Service worker registered successfully");
  },
});
