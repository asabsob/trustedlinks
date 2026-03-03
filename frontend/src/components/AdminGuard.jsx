import { Navigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";

export default function AdminGuard({ children }) {
  const { admin, token, loading } = useAdminAuth();
  if (loading) return null; // أو شاشة loading
  if (!token || !admin) return <Navigate to="/admin/login" replace />;
  return children;
}
