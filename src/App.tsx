import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Shop pages
import { LoginPage } from "./pages/shop/LoginPage";
import { RegisterPage } from "./pages/shop/RegisterPage";

// Admin pages
import { AdminLoginPage } from "./pages/admin/AdminLoginPage";

// Layouts
import { ShopLayout } from "./layouts/ShopLayout";
import { AdminLayout } from "./layouts/AdminLayout";

// Placeholders — filled in next phases
const HomePage = () => (
  <ShopLayout>
    <div className="text-center py-20">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Professional Videos, <span className="text-blue-600">Instantly</span></h1>
      <p className="text-lg text-gray-600 mb-8">Pick a template, customize it, and download your rendered video in minutes.</p>
      <a href="/templates" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700">
        Browse Templates →
      </a>
    </div>
  </ShopLayout>
);

const TemplatesPage = () => <ShopLayout><div className="py-10 text-gray-500">Templates — coming soon</div></ShopLayout>;
const AdminDashboard = () => <AdminLayout><div className="text-xl font-bold">Dashboard</div></AdminLayout>;
const AdminTemplates = () => <AdminLayout><div className="text-xl font-bold">Templates</div></AdminLayout>;
const AdminJobs = () => <AdminLayout><div className="text-xl font-bold">Jobs</div></AdminLayout>;

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/templates" element={<TemplatesPage />} />

        {/* Customer protected */}
        <Route path="/orders" element={<ProtectedRoute><ShopLayout><div>Orders</div></ShopLayout></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<ProtectedRoute requiredRole="ADMIN"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/templates" element={<ProtectedRoute requiredRole="ADMIN"><AdminTemplates /></ProtectedRoute>} />
        <Route path="/admin/jobs" element={<ProtectedRoute requiredRole="ADMIN"><AdminJobs /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
