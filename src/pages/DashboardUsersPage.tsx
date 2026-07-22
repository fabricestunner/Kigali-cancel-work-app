import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "../components/dashboard/Sidebar";
import { Header } from "../components/dashboard/Header";
import {
  Users,
  UserPlus,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Shield,
} from "lucide-react";
import {
  getAllUsers,
  createUser,
  updateUserRole,
  deleteUser,
  type User,
} from "../services/user.service";
import type { Role } from "../utils/auth";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLE_STYLES: Record<Role, string> = {
  admin: "bg-violet-50 text-violet-700 border-violet-200",
  promoter: "bg-blue-50 text-blue-700 border-blue-200",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-RW", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Every mutation here can be refused by the server for reasons the UI cannot
// know in advance (last admin standing, acting on your own account), so every
// handler surfaces the API's message verbatim rather than guessing one.
function extractErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err) && err.response?.data?.message) {
    return err.response.data.message;
  }
  return fallback;
}

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100">
      {[...Array(4)].map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div
            className="h-4 bg-slate-100 rounded animate-pulse"
            style={{ width: `${55 + ((i * 17) % 40)}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

function DeleteAction({
  user,
  onDelete,
}: {
  user: User;
  onDelete: (id: string) => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(user.id);
    setDeleting(false);
    setConfirming(false);
  };

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        title="Delete user"
        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5 justify-end">
      <span className="font-['Inter'] text-xs text-on-surface-variant whitespace-nowrap">
        Delete?
      </span>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-['Inter'] text-xs font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
      >
        {deleting ? "…" : "Yes"}
      </button>
      <button
        onClick={() => setConfirming(false)}
        disabled={deleting}
        className="px-2.5 py-1 rounded-lg border border-outline-variant font-['Inter'] text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50"
      >
        No
      </button>
    </div>
  );
}

export function DashboardUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);

  // New-user form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("promoter");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch {
      setError("Failed to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !EMAIL_PATTERN.test(trimmedEmail)) {
      setFormError("Please enter a valid email address");
      return;
    }
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters");
      return;
    }

    setSubmitting(true);
    try {
      await createUser({ email: trimmedEmail, password, role });
      setEmail("");
      setPassword("");
      setRole("promoter");
      await load();
      showToast("User added");
    } catch (err) {
      setFormError(extractErrorMessage(err, "Failed to add user. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (id: string, nextRole: Role) => {
    setRowError(null);
    setUpdatingRoleId(id);
    try {
      const updated = await updateUserRole(id, nextRole);
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      showToast(`Role updated to ${nextRole}`);
    } catch (err) {
      // A role change can be refused (self-demotion, last admin standing) —
      // reload so the select reverts to the server's actual value and show
      // the server's reason rather than leaving the dropdown in a stale state.
      await load();
      setRowError({ id, message: extractErrorMessage(err, "Failed to update role.") });
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setRowError(null);
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      showToast("User deleted");
    } catch (err) {
      setRowError({ id, message: extractErrorMessage(err, "Failed to delete user.") });
    }
  };

  return (
    <div className="min-h-screen bg-surface flex">
      <Sidebar />
      <div className="flex-1 lg:ml-64 flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-on-surface">
                  Users
                </h2>
                <p className="font-['Inter'] text-sm text-on-surface-variant mt-0.5">
                  Manage dashboard accounts and roles
                </p>
              </div>
              <button
                onClick={load}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-outline-variant text-sm font-['Inter'] font-semibold text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            {/* Add user */}
            <div className="bg-white rounded-2xl shadow-sm border border-outline-variant p-5">
              <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-on-surface flex items-center gap-2 mb-4">
                <UserPlus className="w-4.5 h-4.5 text-primary" />
                Add User
              </h3>
              <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 items-start">
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 min-w-0 bg-surface-container border border-outline-variant rounded-xl px-4 py-2.5 font-['Inter'] text-sm outline-none focus:border-primary"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 min-w-0 bg-surface-container border border-outline-variant rounded-xl px-4 py-2.5 font-['Inter'] text-sm outline-none focus:border-primary"
                  required
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="bg-surface-container border border-outline-variant rounded-xl px-3 py-2.5 font-['Inter'] text-sm text-on-surface outline-none"
                >
                  <option value="promoter">Promoter</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-primary text-white font-['Inter'] text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap"
                >
                  {submitting ? "Adding…" : "Add User"}
                </button>
              </form>
              {formError && (
                <p className="mt-3 font-['Inter'] text-xs text-error flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {formError}
                </p>
              )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
              {error ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-on-surface-variant">
                  <AlertCircle className="w-10 h-10 text-red-400" />
                  <p className="font-['Inter'] text-sm">{error}</p>
                  <button
                    onClick={load}
                    className="text-primary font-['Inter'] text-sm font-semibold hover:underline"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        {["Email", "Role", "Created", ""].map((h) => (
                          <th
                            key={h}
                            className="px-4 py-3.5 text-left font-['Inter'] text-xs font-semibold text-on-surface-variant uppercase tracking-wider whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        [...Array(3)].map((_, i) => <SkeletonRow key={i} />)
                      ) : users.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-16 text-center">
                            <div className="flex flex-col items-center gap-2 text-on-surface-variant">
                              <Users className="w-10 h-10 opacity-30" />
                              <p className="font-['Inter'] text-sm">No users found</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        users.map((u, idx) => (
                          <motion.tr
                            key={u.id}
                            className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.03 }}
                          >
                            <td className="px-4 py-4">
                              <div className="font-['Inter'] text-sm font-semibold text-on-surface">
                                {u.email}
                              </div>
                              {rowError?.id === u.id && (
                                <div className="font-['Inter'] text-xs text-error mt-1 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                  {rowError.message}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${ROLE_STYLES[u.role]}`}
                                >
                                  {u.role === "admin" ? (
                                    <ShieldCheck className="w-3 h-3" />
                                  ) : (
                                    <Shield className="w-3 h-3" />
                                  )}
                                  {u.role}
                                </span>
                                <select
                                  value={u.role}
                                  onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                                  disabled={updatingRoleId === u.id}
                                  className="bg-surface-container border border-outline-variant rounded-lg px-2 py-1 font-['Inter'] text-xs text-on-surface outline-none disabled:opacity-50"
                                  title="Change role"
                                >
                                  <option value="promoter">Promoter</option>
                                  <option value="admin">Admin</option>
                                </select>
                              </div>
                            </td>
                            <td className="px-4 py-4 font-['Inter'] text-xs text-on-surface-variant whitespace-nowrap">
                              {formatDate(u.createdAt)}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center justify-end">
                                <DeleteAction user={u} onDelete={handleDelete} />
                              </div>
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {toastMsg && (
          <motion.div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-slate-900 text-white px-5 py-3 rounded-full font-['Inter'] text-sm font-semibold shadow-xl flex items-center gap-2"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
