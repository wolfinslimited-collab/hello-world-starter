// Main entry point - v2 (force rebuild)
// import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "assets/css/tailwindcss.css";
import "assets/css/index.scss";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { StoreContextProvider } from "./context";
import { ToastContainer, Bounce } from "react-toastify";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <StoreContextProvider>
      <ToastContainer
        className="w-full text-sm rounded-3xl !z-[99999]"
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick={true}
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        transition={Bounce}
      />

      <App />
    </StoreContextProvider>
  </BrowserRouter>
);
