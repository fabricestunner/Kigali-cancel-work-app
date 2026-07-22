import { Navigate } from "react-router-dom";
import { isAuthenticated, getRole, type Role } from "../utils/auth";

/**
 * Guards the dashboard routes, and optionally a specific set of roles (e.g.
 * `/scan`, which only `promoter` and `admin` accounts should reach).
 *
 * This is UX, not security: it only inspects localStorage, which any user can
 * edit. Real access control is the API rejecting unauthenticated requests.
 */
export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  /** Omitted = any authenticated user, unchanged from the original behaviour. */
  allowedRoles?: Role[];
}) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles) {
    const role = getRole();
    // TODO(T-B8): a null role currently means "no role claim on the token"
    // and is treated as permitted so the app keeps working for accounts that
    // predate roles. Once every account is guaranteed to carry a role claim,
    // this must tighten to deny-by-default (redirect when role is null).
    if (role !== null && !allowedRoles.includes(role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
