import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";

/**
 * Guards the dashboard routes.
 *
 * This is UX, not security: it only inspects localStorage, which any user can
 * edit. Real access control is the API rejecting unauthenticated requests.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
