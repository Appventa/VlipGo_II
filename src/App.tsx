import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Placeholder pages — to be implemented
const HomePage = () => <div className="p-8 text-2xl font-bold">VlipGo — Coming Soon</div>;

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
