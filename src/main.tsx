import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import App from "./App.tsx";
import "./index.css";
import { store, persistor } from "./redux/store/index.ts"; // ✅ import persistor
import { PersistGate } from "redux-persist/integration/react";
import { Toaster } from "sonner";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#FFFBF2",
              backgroundImage:
                "linear-gradient(#000, #00000095), linear-gradient(to right, #E23373, #FEC133)",
              backgroundOrigin: "border-box",
              backgroundClip: "padding-box, border-box",
              color: "#ffffff",
              border: "1px solid transparent",
              borderRadius: "8px",
              fontFamily: "Montserrat, sans-serif",
              padding: "16px",
            },
            classNames: {
              icon: "text-[#3E2723]",
            },
          }}
          icons={{
            success: (
              <div className="w-6 h-6 rounded-full bg-[#5D4037] flex items-center justify-center">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            ),
            error: (
              <div className="w-6 h-6 rounded-full bg-[#fff] flex items-center justify-center">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="black"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-3.5 h-3.5"
                >
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
            ),
          }}
        />
        <App />
      </PersistGate>
    </Provider>
  </StrictMode>,
);
