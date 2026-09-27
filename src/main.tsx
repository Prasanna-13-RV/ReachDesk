import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { router } from "@/app/router";
import { AuthProvider } from "@/features/auth/AuthProvider";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <AuthProvider>
      <Toaster richColors position="top-right" closeButton />
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
);
