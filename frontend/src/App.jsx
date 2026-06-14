import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AdminLayout from "./components/admin/AdminLayout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/admin/Dashboard";
import Teachers from "./pages/admin/Teachers";
import Subjects from "./pages/admin/Subjects";
import Assignments from "./pages/admin/Assignments";
import Resources from "./pages/admin/Resources";
import Announcements from "./pages/admin/Announcements";
import Submissions from "./pages/admin/Submissions";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="teachers" element={<Teachers />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="assignments" element={<Assignments />} />
          <Route path="resources" element={<Resources />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="submissions" element={<Submissions />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
