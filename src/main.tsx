import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import App from "./App.tsx";
import "./index.css";
import { store, persistor } from "./redux/store/index.ts"; // ✅ import persistor
import { PersistGate } from "redux-persist/integration/react";
import { Toaster } from "sonner";
import { CircleAlert, CircleCheckBig } from "lucide-react";

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
              <div className="w-6 h-6 rounded-full flex items-center justify-center">
                <CircleCheckBig color="white" className="!mr-1" />
              </div>
            ),
            error: (
              <div className="w-6 h-6 rounded-full flex items-center justify-center">
                <CircleAlert color="white" className="!mr-1" />
              </div>
            ),
          }}
        />
        <App />
      </PersistGate>
    </Provider>
  </StrictMode>,
);
