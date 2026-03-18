import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Shop pages
import { LoginPage } from "./pages/shop/LoginPage";
import { RegisterPage } from "./pages/shop/RegisterPage";
import { TemplatesPage } from "./pages/shop/TemplatesPage";
import { TemplateDetailPage } from "./pages/shop/TemplateDetailPage";
import { CustomizePage } from "./pages/shop/CustomizePage";
import { OrdersPage } from "./pages/shop/OrdersPage";
import { OrderDetailPage } from "./pages/shop/OrderDetailPage";

// Admin pages
import { AdminLoginPage } from "./pages/admin/AdminLoginPage";
import { AdminTemplatesPage } from "./pages/admin/AdminTemplatesPage";
import { AdminNewTemplatePage } from "./pages/admin/AdminNewTemplatePage";
import { AdminJobsPage } from "./pages/admin/AdminJobsPage";

// Layouts
import { ShopLayout } from "./layouts/ShopLayout";
import { AdminLayout } from "./layouts/AdminLayout";

const HomePage = () => (
  <ShopLayout>
    <div className="text-center py-20">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Professional Videos, <span className="text-blue-600">Instantly</span>
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        Pick a template, customize it, and download your rendered video in minutes.
      </p>
      <a
        href="/templates"
        className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
      >
        Browse Templates →
      </a>
    </div>
  </ShopLayout>
);

const AdminDashboard = () => (
  <AdminLayout>
    <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
    <p className="text-gray-500">Welcome to VlipGo Admin.</p>
  </AdminLayout>
);


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/templates/:id" element={<TemplateDetailPage />} />

        {/* Customer protected */}
        <Route path="/templates/:id/customize" element={<ProtectedRoute><CustomizePage /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
        <Route path="/orders/:jobId" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<ProtectedRoute requiredRole="ADMIN"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/templates" element={<ProtectedRoute requiredRole="ADMIN"><AdminTemplatesPage /></ProtectedRoute>} />
        <Route path="/admin/templates/new" element={<ProtectedRoute requiredRole="ADMIN"><AdminNewTemplatePage /></ProtectedRoute>} />
        <Route path="/admin/templates/:id/edit" element={<ProtectedRoute requiredRole="ADMIN"><AdminNewTemplatePage /></ProtectedRoute>} />
        <Route path="/admin/jobs" element={<ProtectedRoute requiredRole="ADMIN"><AdminJobsPage /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
