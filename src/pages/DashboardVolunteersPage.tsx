import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "../components/dashboard/Sidebar";
import { Header } from "../components/dashboard/Header";
import {
  Users,
  Clock,
  PhoneCall,
  CheckCircle2,
  Search,
  Filter,
  X,
  ChevronRight,
  Mail,
  Phone,
  RefreshCw,
  AlertCircle,
  Trash2,
} from "lucide-react";
import {
  getAllVolunteers,
  updateVolunteerStatus,
  deleteVolunteer,
  type Volunteer,
} from "../services/volunteer.service";
import { ExportMenu } from "../components/dashboard/ExportMenu";
import type { ExportColumn } from "../utils/exportData";

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  contacted: {
    label: "Contacted",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  confirmed: {
    label: "Confirmed",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
} as const;

const AFFILIATION_LABELS: Record<Volunteer["affiliation"], string> = {
  rotaractor: "Rotaractor",
  rotarian: "Rotarian",
  none: "None",
};

function affiliationDetail(v: Volunteer): string {
  if (v.affiliation === "rotaractor" && v.team) return v.team;
  if (v.affiliation === "rotarian" && v.rotary_club) return v.rotary_club;
  return "";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-RW", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const EXPORT_COLUMNS: ExportColumn<Volunteer>[] = [
  { header: "Name", value: (v) => v.full_name, width: 28 },
  { header: "Email", value: (v) => v.email, width: 32 },
  { header: "Phone", value: (v) => v.phone ?? "—", width: 20 },
  {
    header: "Affiliation",
    value: (v) => AFFILIATION_LABELS[v.affiliation] ?? "None",
    width: 16,
  },
  {
    header: "Team / Club",
    value: (v) => affiliationDetail(v) || "—",
    width: 24,
  },
  { header: "Status", value: (v) => STATUS_CONFIG[v.status].label, width: 16 },
  { header: "Submitted", value: (v) => formatDate(v.createdAt), width: 18 },
];

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100">
      {[...Array(7)].map((_, i) => (
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

function DetailDrawer({
  volunteer,
  onClose,
  onStatusChange,
  onDelete,
}: {
  volunteer: Volunteer;
  onClose: () => void;
  onStatusChange: (id: number, status: Volunteer["status"]) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [updating, setUpdating] = useState<Volunteer["status"] | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const cfg = STATUS_CONFIG[volunteer.status];
  const nextStatuses = (["pending", "contacted", "confirmed"] as const).filter(
    (s) => s !== volunteer.status,
  );

  const handleStatus = async (s: Volunteer["status"]) => {
    setUpdating(s);
    await onStatusChange(volunteer.id, s);
    setUpdating(null);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(volunteer.id);
    setDeleting(false);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-y-auto"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-secondary" />
            <span className="font-['Plus_Jakarta_Sans'] text-base font-bold text-on-surface">
              Volunteer Details
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-3">
              <span className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-white">
                {volunteer.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <h2 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-on-surface">
              {volunteer.full_name}
            </h2>
          </div>

          <div className="flex gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
            {volunteer.affiliation !== "none" && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border bg-violet-50 text-violet-700 border-violet-200">
                {AFFILIATION_LABELS[volunteer.affiliation]}
              </span>
            )}
          </div>

          {(volunteer.team || volunteer.rotary_club) && (
            <div className="space-y-1">
              <p className="font-['Inter'] text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                {volunteer.affiliation === "rotaractor"
                  ? "Preferred Team"
                  : "Rotary Club"}
              </p>
              <p className="font-['Inter'] text-sm text-on-surface">
                {affiliationDetail(volunteer)}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <p className="font-['Inter'] text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Contact
            </p>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-slate-500" />
              </div>
              <a
                href={`mailto:${volunteer.email}`}
                className="text-blue-600 hover:underline font-['Inter']"
              >
                {volunteer.email}
              </a>
            </div>
            {volunteer.phone && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-slate-500" />
                </div>
                <a
                  href={`tel:${volunteer.phone}`}
                  className="text-on-surface font-['Inter']"
                >
                  {volunteer.phone}
                </a>
              </div>
            )}
          </div>

          <div className="font-['Inter'] text-xs text-on-surface-variant">
            Submitted on {formatDate(volunteer.createdAt)}
          </div>

          <div className="space-y-2">
            <p className="font-['Inter'] text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Update Status
            </p>
            <div className="flex flex-col gap-2">
              {nextStatuses.map((s) => {
                const c = STATUS_CONFIG[s];
                return (
                  <button
                    key={s}
                    onClick={() => handleStatus(s)}
                    disabled={updating !== null}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 font-['Inter'] text-sm font-semibold transition-all disabled:opacity-50 ${c.bg} ${c.text} ${c.border} hover:shadow-sm`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                      Mark as {c.label}
                    </span>
                    {updating === s ? (
                      <motion.div
                        className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Delete */}
          <div className="pt-2 border-t border-slate-100">
            {!confirming ? (
              <button
                onClick={() => setConfirming(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-red-200 bg-red-50 text-red-600 font-['Inter'] text-sm font-semibold hover:bg-red-100 transition-all"
              >
                <Trash2 className="w-4 h-4" /> Delete Volunteer
              </button>
            ) : (
              <div className="space-y-2">
                <p className="font-['Inter'] text-xs text-center text-on-surface-variant">
                  Are you sure? This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirming(false)}
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
                      <motion.div
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" /> Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function DashboardVolunteersPage() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Volunteer["status"]>(
    "all",
  );
  const [selected, setSelected] = useState<Volunteer | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllVolunteers();
      setVolunteers(data);
    } catch {
      setError("Failed to load volunteers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(
    () => ({
      total: volunteers.length,
      pending: volunteers.filter((v) => v.status === "pending").length,
      contacted: volunteers.filter((v) => v.status === "contacted").length,
      confirmed: volunteers.filter((v) => v.status === "confirmed").length,
    }),
    [volunteers],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return volunteers.filter((v) => {
      const matchSearch =
        !q ||
        v.full_name.toLowerCase().includes(q) ||
        v.email.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || v.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [volunteers, search, statusFilter]);

  const handleStatusChange = async (
    id: number,
    status: Volunteer["status"],
  ) => {
    setVolunteers((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status } : v)),
    );
    if (selected?.id === id)
      setSelected((prev) => (prev ? { ...prev, status } : prev));
    try {
      await updateVolunteerStatus(id, status);
      showToast(`Status updated to ${STATUS_CONFIG[status].label}`);
    } catch {
      await load();
      showToast("Failed to update status");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteVolunteer(id);
      setVolunteers((prev) => prev.filter((v) => v.id !== id));
      setSelected(null);
      showToast("Volunteer deleted");
    } catch {
      showToast("Failed to delete volunteer");
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
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
                  Volunteers
                </h2>
                <p className="font-['Inter'] text-sm text-on-surface-variant mt-0.5">
                  Manage volunteer applications
                </p>
              </div>
              <div className="flex items-center gap-3">
                <ExportMenu
                  rows={filtered}
                  columns={EXPORT_COLUMNS}
                  filename="volunteers"
                  title="Volunteers Report"
                  disabled={loading}
                />
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
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Applications"
                value={stats.total}
                icon={Users}
                color="bg-primary/10 text-primary"
              />
              <StatCard
                label="Pending Review"
                value={stats.pending}
                icon={Clock}
                color="bg-amber-100 text-amber-600"
              />
              <StatCard
                label="Contacted"
                value={stats.contacted}
                icon={PhoneCall}
                color="bg-blue-100 text-blue-600"
              />
              <StatCard
                label="Confirmed"
                value={stats.confirmed}
                icon={CheckCircle2}
                color="bg-emerald-100 text-emerald-600"
              />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-outline-variant p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 flex items-center gap-2 bg-surface-container rounded-xl px-4 py-2.5 border border-outline-variant">
                  <Search className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search by name or email…"
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
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as typeof statusFilter)
                    }
                    className="bg-surface-container border border-outline-variant rounded-xl px-3 py-2.5 font-['Inter'] text-sm text-on-surface outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="contacted">Contacted</option>
                    <option value="confirmed">Confirmed</option>
                  </select>
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
                        {["#", "Name", "Contact", "Affiliation", "Status", "Date", ""].map(
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
                          <td colSpan={7} className="px-4 py-16 text-center">
                            <div className="flex flex-col items-center gap-2 text-on-surface-variant">
                              <Users className="w-10 h-10 opacity-30" />
                              <p className="font-['Inter'] text-sm">
                                No volunteers found
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filtered.map((v, idx) => {
                          const cfg = STATUS_CONFIG[v.status];
                          return (
                            <motion.tr
                              key={v.id}
                              className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors cursor-pointer group"
                              onClick={() => setSelected(v)}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: idx * 0.03 }}
                            >
                              <td className="px-4 py-4 font-['Inter'] text-sm text-on-surface-variant">
                                {idx + 1}
                              </td>
                              <td className="px-4 py-4 font-['Inter'] text-sm font-semibold text-on-surface">
                                {v.full_name}
                              </td>
                              <td className="px-4 py-4">
                                <div className="font-['Inter'] text-sm text-on-surface">
                                  {v.email}
                                </div>
                                {v.phone && (
                                  <div className="font-['Inter'] text-xs text-on-surface-variant mt-0.5">
                                    {v.phone}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-4">
                                <div className="font-['Inter'] text-sm text-on-surface">
                                  {AFFILIATION_LABELS[v.affiliation] ?? "None"}
                                </div>
                                {affiliationDetail(v) && (
                                  <div className="font-['Inter'] text-xs text-on-surface-variant mt-0.5">
                                    {affiliationDetail(v)}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-4">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}
                                  />
                                  {cfg.label}
                                </span>
                              </td>
                              <td className="px-4 py-4 font-['Inter'] text-sm text-on-surface-variant whitespace-nowrap">
                                {formatDate(v.createdAt)}
                              </td>
                              <td className="px-4 py-4">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelected(v);
                                  }}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-['Inter'] text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/20"
                                >
                                  View <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </motion.tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {!loading && !error && filtered.length > 0 && (
                <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
                  <p className="font-['Inter'] text-xs text-on-surface-variant">
                    Showing {filtered.length} of {volunteers.length} volunteer
                    {volunteers.length !== 1 ? "s" : ""}
                  </p>
                  <div className="flex items-center gap-4">
                    {(["pending", "contacted", "confirmed"] as const).map(
                      (s) => {
                        const c = STATUS_CONFIG[s];
                        const count = volunteers.filter(
                          (v) => v.status === s,
                        ).length;
                        return (
                          <div key={s} className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                            <span className="font-['Inter'] text-xs text-on-surface-variant">
                              {count} {c.label}
                            </span>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {selected && (
          <DetailDrawer
            volunteer={selected}
            onClose={() => setSelected(null)}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
          />
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
