import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "../components/dashboard/Sidebar";
import { Header } from "../components/dashboard/Header";
import {
  UsersRound,
  Users,
  Mail,
  Search,
  X,
  RefreshCw,
  AlertCircle,
  Trash2,
  Plus,
  Pencil,
  CheckCircle2,
  Loader2,
  Crown,
} from "lucide-react";
import {
  getAllBuddyGroups,
  createBuddyGroup,
  updateBuddyGroup,
  deleteBuddyGroup,
  type BuddyGroup,
  type BuddyGroupDTO,
} from "../services/buddygroup.service";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-RW", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100">
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div
            className="h-4 bg-slate-100 rounded animate-pulse"
            style={{ width: `${60 + ((i * 15) % 40)}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <motion.div
      className="bg-white rounded-2xl p-5 shadow-sm border border-outline-variant"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-on-surface leading-none mb-1">
        {value}
      </div>
      <div className="font-['Inter'] text-sm text-on-surface-variant">
        {label}
      </div>
    </motion.div>
  );
}

const EMPTY_FORM: BuddyGroupDTO = {
  name: "",
  leader_name: "",
  leader_email: "",
  members: 0,
};

function GroupFormModal({
  group,
  onClose,
  onSave,
}: {
  group: BuddyGroup | null; // null = create
  onClose: () => void;
  onSave: (data: BuddyGroupDTO, id?: number) => Promise<void>;
}) {
  const [form, setForm] = useState<BuddyGroupDTO>(
    group
      ? {
          name: group.name,
          leader_name: group.leader_name,
          leader_email: group.leader_email,
          members: group.members,
        }
      : EMPTY_FORM,
  );
  const [saving, setSaving] = useState(false);

  const inputCls =
    "w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface font-['Inter'] text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary transition";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form, group?.id);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.form
        onSubmit={handleSubmit}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 16 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UsersRound className="w-5 h-5 text-primary" />
            <span className="font-['Plus_Jakarta_Sans'] text-base font-bold text-on-surface">
              {group ? "Edit Buddy Group" : "New Buddy Group"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="font-['Inter'] text-sm font-semibold text-on-surface">
              Group Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Team Isonga"
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <label className="font-['Inter'] text-sm font-semibold text-on-surface">
              Leader Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              required
              value={form.leader_name}
              onChange={(e) => setForm({ ...form, leader_name: e.target.value })}
              placeholder="e.g. Claude Ishimwe"
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <label className="font-['Inter'] text-sm font-semibold text-on-surface">
              Leader Email <span className="text-error">*</span>
            </label>
            <input
              type="email"
              required
              value={form.leader_email}
              onChange={(e) => setForm({ ...form, leader_email: e.target.value })}
              placeholder="leader@example.com"
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <label className="font-['Inter'] text-sm font-semibold text-on-surface">
              Members
            </label>
            <input
              type="number"
              min={0}
              value={form.members ?? 0}
              onChange={(e) =>
                setForm({ ...form, members: Math.max(0, parseInt(e.target.value || "0", 10)) })
              }
              className={inputCls}
            />
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-['Inter'] text-sm font-semibold text-on-surface hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-white font-['Inter'] text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            {group ? "Save Changes" : "Create Group"}
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

export function DashboardBuddyGroupsPage() {
  const [groups, setGroups] = useState<BuddyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ open: boolean; group: BuddyGroup | null }>({
    open: false,
    group: null,
  });
  const [confirmingDelete, setConfirmingDelete] = useState<BuddyGroup | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllBuddyGroups();
      setGroups(data);
    } catch {
      setError("Failed to load buddy groups. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(
    () => ({
      total: groups.length,
      members: groups.reduce((sum, g) => sum + g.members, 0),
    }),
    [groups],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return groups;
    return groups.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.leader_name.toLowerCase().includes(q) ||
        g.leader_email.toLowerCase().includes(q),
    );
  }, [groups, search]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSave = async (data: BuddyGroupDTO, id?: number) => {
    try {
      if (id !== undefined) {
        const updated = await updateBuddyGroup(id, data);
        setGroups((prev) => prev.map((g) => (g.id === id ? updated : g)));
        showToast("Buddy group updated");
      } else {
        const created = await createBuddyGroup(data);
        setGroups((prev) => [created, ...prev]);
        showToast("Buddy group created");
      }
      setModal({ open: false, group: null });
    } catch {
      showToast(id !== undefined ? "Failed to update group" : "Failed to create group");
    }
  };

  const handleDelete = async () => {
    if (!confirmingDelete) return;
    setDeleting(true);
    try {
      await deleteBuddyGroup(confirmingDelete.id);
      setGroups((prev) => prev.filter((g) => g.id !== confirmingDelete.id));
      showToast("Buddy group deleted");
      setConfirmingDelete(null);
    } catch {
      showToast("Failed to delete group");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex">
      <Sidebar />
      <div className="flex-1 lg:ml-64 flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-on-surface">
                  Buddy Groups
                </h2>
                <p className="font-['Inter'] text-sm text-on-surface-variant mt-0.5">
                  Manage buddy teams and their leaders
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={load}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-outline-variant text-sm font-['Inter'] font-semibold text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </button>
                <button
                  onClick={() => setModal({ open: true, group: null })}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-primary text-white text-sm font-['Inter'] font-semibold hover:opacity-90 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  New Group
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Groups"
                value={stats.total}
                icon={UsersRound}
                color="bg-primary/10 text-primary"
              />
              <StatCard
                label="Total Members"
                value={stats.members}
                icon={Users}
                color="bg-violet-100 text-violet-600"
              />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-outline-variant p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 flex items-center gap-2 bg-surface-container rounded-xl px-4 py-2.5 border border-outline-variant">
                  <Search className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search by group name or leader…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-transparent border-none outline-none font-['Inter'] text-sm w-full placeholder:text-on-surface-variant"
                  />
                  {search && (
                    <button onClick={() => setSearch("")}>
                      <X className="w-4 h-4 text-on-surface-variant hover:text-on-surface" />
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-center px-3 py-2.5 rounded-xl bg-primary/10 font-['Inter'] text-sm font-semibold text-primary whitespace-nowrap">
                  {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>

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
                        {["#", "Group", "Team Leader", "Members", "Created", ""].map(
                          (h) => (
                            <th
                              key={h}
                              className="px-4 py-3.5 text-left font-['Inter'] text-xs font-semibold text-on-surface-variant uppercase tracking-wider whitespace-nowrap"
                            >
                              {h}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                      ) : filtered.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-16 text-center">
                            <div className="flex flex-col items-center gap-2 text-on-surface-variant">
                              <UsersRound className="w-10 h-10 opacity-30" />
                              <p className="font-['Inter'] text-sm">
                                {groups.length === 0
                                  ? "No buddy groups yet — create the first one."
                                  : "No groups match your search"}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filtered.map((g, idx) => (
                          <motion.tr
                            key={g.id}
                            className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.03 }}
                          >
                            <td className="px-4 py-4 font-['Inter'] text-sm text-on-surface-variant">
                              {idx + 1}
                            </td>
                            <td className="px-4 py-4 font-['Inter'] text-sm font-semibold text-on-surface">
                              {g.name}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-1.5 font-['Inter'] text-sm text-on-surface">
                                <Crown className="w-3.5 h-3.5 text-amber-500" />
                                {g.leader_name}
                              </div>
                              <a
                                href={`mailto:${g.leader_email}`}
                                className="flex items-center gap-1.5 font-['Inter'] text-xs text-blue-600 hover:underline mt-0.5"
                              >
                                <Mail className="w-3 h-3" />
                                {g.leader_email}
                              </a>
                            </td>
                            <td className="px-4 py-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-violet-50 text-violet-700 border-violet-200">
                                <Users className="w-3 h-3" />
                                {g.members}
                              </span>
                            </td>
                            <td className="px-4 py-4 font-['Inter'] text-sm text-on-surface-variant whitespace-nowrap">
                              {formatDate(g.createdAt)}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setModal({ open: true, group: g })}
                                  title="Edit group"
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setConfirmingDelete(g)}
                                  title="Delete group"
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
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
        {modal.open && (
          <GroupFormModal
            group={modal.group}
            onClose={() => setModal({ open: false, group: null })}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmingDelete && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setConfirmingDelete(null)}
            />
            <motion.div
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4"
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 16 }}
            >
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-on-surface">
                  Delete "{confirmingDelete.name}"?
                </p>
                <p className="font-['Inter'] text-sm text-on-surface-variant">
                  This cannot be undone. Orders linked to this group will keep
                  their history.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmingDelete(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-['Inter'] text-sm font-semibold text-on-surface hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white font-['Inter'] text-sm font-semibold hover:bg-red-700 transition-all disabled:opacity-50"
                >
                  {deleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
