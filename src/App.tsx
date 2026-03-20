import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useConvexAuth } from "convex/react";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Shop pages
import { LandingPage } from "./pages/shop/LandingPage";
import { LoginPage } from "./pages/shop/LoginPage";
import { RegisterPage } from "./pages/shop/RegisterPage";
import { TemplatesPage } from "./pages/shop/TemplatesPage";
import { TemplateDetailPage } from "./pages/shop/TemplateDetailPage";
import { CustomizePage } from "./pages/shop/CustomizePage";
import { OrdersPage } from "./pages/shop/OrdersPage";
import { OrderDetailPage } from "./pages/shop/OrderDetailPage";
import { DashboardPage } from "./pages/shop/DashboardPage";
import { InboxPage } from "./pages/shop/InboxPage";

// Admin pages
import { AdminLoginPage } from "./pages/admin/AdminLoginPage";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { AdminTemplatesPage } from "./pages/admin/AdminTemplatesPage";
import { AdminNewTemplatePage } from "./pages/admin/AdminNewTemplatePage";
import { AdminJobsPage } from "./pages/admin/AdminJobsPage";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";
import { AdminUserDetailPage } from "./pages/admin/AdminUserDetailPage";

/** Redirect logged-in users from `/` to `/dashboard` */
function HomeRoute() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <LandingPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomeRoute />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/templates/:id" element={<TemplateDetailPage />} />

        {/* Customer protected */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/templates/:id/customize" element={<ProtectedRoute><CustomizePage /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
        <Route path="/orders/:jobId" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
        <Route path="/inbox" element={<ProtectedRoute><InboxPage /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<ProtectedRoute requiredRole="ADMIN"><AdminDashboardPage /></ProtectedRoute>} />
        <Route path="/admin/templates" element={<ProtectedRoute requiredRole="ADMIN"><AdminTemplatesPage /></ProtectedRoute>} />
        <Route path="/admin/templates/new" element={<ProtectedRoute requiredRole="ADMIN"><AdminNewTemplatePage /></ProtectedRoute>} />
        <Route path="/admin/templates/:id/edit" element={<ProtectedRoute requiredRole="ADMIN"><AdminNewTemplatePage /></ProtectedRoute>} />
        <Route path="/admin/jobs" element={<ProtectedRoute requiredRole="ADMIN"><AdminJobsPage /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute requiredRole="ADMIN"><AdminUsersPage /></ProtectedRoute>} />
        <Route path="/admin/users/:userId" element={<ProtectedRoute requiredRole="ADMIN"><AdminUserDetailPage /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
