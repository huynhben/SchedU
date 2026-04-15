import { Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (adminOnly && !user.isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}
