import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "../components/dashboard/Sidebar";
import { Header } from "../components/dashboard/Header";
import {
  Bell,
  Mail,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  UserPlus,
} from "lucide-react";
import {
  getAllRecipients,
  createRecipient,
  updateRecipient,
  deleteRecipient,
  type NotificationRecipient,
} from "../services/notification.service";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-RW", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-slate-100">
      <div className="h-4 w-4 bg-slate-100 rounded-full animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-slate-100 rounded animate-pulse w-1/3" />
        <div className="h-3 bg-slate-100 rounded animate-pulse w-1/4" />
      </div>
      <div className="h-6 w-11 bg-slate-100 rounded-full animate-pulse" />
    </div>
  );
}

function RecipientRow({
  recipient,
  onToggleActive,
  onDelete,
}: {
  recipient: NotificationRecipient;
  onToggleActive: (recipient: NotificationRecipient) => Promise<void>;
  onDelete: (recipient: NotificationRecipient) => Promise<void>;
}) {
  const [toggling, setToggling] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    await onToggleActive(recipient);
    setToggling(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(recipient);
    setDeleting(false);
  };

  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Mail className="w-4 h-4 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-['Inter'] text-sm font-semibold text-on-surface truncate">
          {recipient.email}
        </div>
        <div className="font-['Inter'] text-xs text-on-surface-variant truncate">
          {recipient.name ? `${recipient.name} · ` : ""}
          Added {formatDate(recipient.createdAt)}
        </div>
      </div>

      <span
        className={`hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
          recipient.active
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-slate-50 text-slate-500 border-slate-200"
        }`}
      >
        {recipient.active ? "Active" : "Paused"}
      </span>

      <button
        type="button"
        role="switch"
        aria-checked={recipient.active}
        aria-label={recipient.active ? "Deactivate recipient" : "Activate recipient"}
        onClick={handleToggle}
        disabled={toggling}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
          recipient.active ? "bg-primary" : "bg-slate-300"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            recipient.active ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>

      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="p-2 rounded-lg text-on-surface-variant hover:bg-red-50 hover:text-red-600 transition-colors flex-shrink-0"
          aria-label="Delete recipient"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ) : (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-['Inter'] text-xs font-semibold text-on-surface hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white font-['Inter'] text-xs font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {deleting ? "…" : "Remove"}
          </button>
        </div>
      )}
    </div>
  );
}

export function DashboardNotificationsPage() {
  const [recipients, setRecipients] = useState<NotificationRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllRecipients();
      setRecipients(data);
    } catch {
      setError("Failed to load notification recipients. Please try again.");
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

    setSubmitting(true);
    try {
      await createRecipient({
        email: trimmedEmail,
        name: name.trim() || undefined,
      });
      setEmail("");
      setName("");
      await load();
      showToast("Recipient added");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setFormError(
          err.response.data?.message ?? "That email is already on the list",
        );
      } else if (axios.isAxiosError(err) && err.response?.data?.message) {
        setFormError(err.response.data.message);
      } else {
        setFormError("Failed to add recipient. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (recipient: NotificationRecipient) => {
    try {
      await updateRecipient(recipient.id, { active: !recipient.active });
      await load();
      showToast(
        recipient.active ? "Recipient paused" : "Recipient activated",
      );
    } catch {
      showToast("Failed to update recipient");
    }
  };

  const handleDelete = async (recipient: NotificationRecipient) => {
    try {
      await deleteRecipient(recipient.id);
      await load();
      showToast("Recipient removed");
    } catch {
      showToast("Failed to remove recipient");
    }
  };

  return (
    <div className="min-h-screen bg-surface flex">
      <Sidebar />
      <div className="flex-1 lg:ml-64 flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-on-surface">
                  Notification Recipients
                </h2>
                <p className="font-['Inter'] text-sm text-on-surface-variant mt-0.5">
                  These addresses receive email notifications for kit orders,
                  donations, volunteer sign-ups, sponsors, pledges and
                  influencer applications.
                </p>
              </div>
              <button
                onClick={load}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-outline-variant text-sm font-['Inter'] font-semibold text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50 flex-shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-outline-variant p-5">
              <div className="flex items-center gap-2 mb-4">
                <UserPlus className="w-4 h-4 text-primary" />
                <h3 className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-on-surface">
                  Add a recipient
                </h3>
              </div>
              <form
                onSubmit={handleAdd}
                className="flex flex-col sm:flex-row gap-3"
              >
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-surface-container border border-outline-variant rounded-xl px-4 py-2.5 font-['Inter'] text-sm text-on-surface outline-none placeholder:text-on-surface-variant"
                />
                <input
                  type="text"
                  placeholder="Name (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 bg-surface-container border border-outline-variant rounded-xl px-4 py-2.5 font-['Inter'] text-sm text-on-surface outline-none placeholder:text-on-surface-variant"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-['Inter'] text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  {submitting ? "Adding…" : "Add"}
                </button>
              </form>
              {formError && (
                <p className="mt-3 flex items-center gap-1.5 font-['Inter'] text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </p>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
                <Bell className="w-4 h-4 text-on-surface-variant" />
                <h3 className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-on-surface">
                  Recipients
                </h3>
                {!loading && !error && (
                  <span className="font-['Inter'] text-xs text-on-surface-variant">
                    ({recipients.length})
                  </span>
                )}
              </div>

              {error ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-on-surface-variant">
                  <AlertCircle className="w-10 h-10 text-red-400" />
                  <p className="font-['Inter'] text-sm">{error}</p>
                  <button
                    onClick={load}
                    className="text-primary font-['Inter'] text-sm font-semibold hover:underline"
                  >
                    Retry
                  </button>
                </div>
              ) : loading ? (
                <div>
                  {[...Array(3)].map((_, i) => (
                    <SkeletonRow key={i} />
                  ))}
                </div>
              ) : recipients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-on-surface-variant">
                  <Bell className="w-10 h-10 opacity-30" />
                  <p className="font-['Inter'] text-sm">
                    No notification recipients yet
                  </p>
                </div>
              ) : (
                recipients.map((r) => (
                  <RecipientRow
                    key={r.id}
                    recipient={r}
                    onToggleActive={handleToggleActive}
                    onDelete={handleDelete}
                  />
                ))
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
