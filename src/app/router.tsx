import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { LoginPage } from "@/features/auth/LoginPage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { ContactsPage } from "@/features/contacts/ContactsPage";
import { ImportPage } from "@/features/imports/ImportPage";
import { CampaignsPage } from "@/features/campaigns/CampaignsPage";
import { TemplatesPage } from "@/features/templates/TemplatesPage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/", element: <DashboardPage /> },
          { path: "/contacts", element: <ContactsPage /> },
          { path: "/imports", element: <ImportPage /> },
          { path: "/campaigns", element: <CampaignsPage /> },
          { path: "/templates", element: <TemplatesPage /> },
          { path: "/settings", element: <SettingsPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
