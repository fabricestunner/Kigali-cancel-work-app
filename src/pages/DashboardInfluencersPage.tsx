import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "../components/dashboard/Sidebar";
import { Header } from "../components/dashboard/Header";
import {
  Briefcase,
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
  Link,
  Trash2,
} from "lucide-react";
import {
  getAllInfluencers,
  updateInfluencerStatus,
  deleteInfluencer,
  type Influencer,
} from "../services/influencer.service";
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-RW", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatSocials(social: Influencer["social_media"]) {
  if (!social || Object.keys(social).length === 0) return "—";
  return Object.entries(social)
    .map(([platform, link]) => `${platform}: ${link}`)
    .join("\n");
}

const EXPORT_COLUMNS: ExportColumn<Influencer>[] = [
  { header: "Name", value: (f) => f.full_name, width: 26 },
  { header: "Email", value: (f) => f.email, width: 30 },
  { header: "Phone", value: (f) => f.phone ?? "—", width: 18 },
  { header: "Social Media", value: (f) => formatSocials(f.social_media), width: 40 },
  { header: "Status", value: (f) => STATUS_CONFIG[f.status].label, width: 14 },
  { header: "Submitted", value: (f) => formatDate(f.createdAt), width: 16 },
];

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

function DetailDrawer({
  influencer,
  onClose,
  onStatusChange,
  onDelete,
}: {
  influencer: Influencer;
  onClose: () => void;
  onStatusChange: (id: number, status: Influencer["status"]) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [updating, setUpdating] = useState<Influencer["status"] | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const cfg = STATUS_CONFIG[influencer.status];
  const nextStatuses = (["pending", "contacted", "confirmed"] as const).filter(
    (s) => s !== influencer.status,
  );

  const handleStatus = async (s: Influencer["status"]) => {
    setUpdating(s);
    await onStatusChange(influencer.id, s);
    setUpdating(null);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(influencer.id);
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
            <Briefcase className="w-5 h-5 text-secondary" />
            <span className="font-['Plus_Jakarta_Sans'] text-base font-bold text-on-surface">
              Influencer Details
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
                {influencer.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <h2 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-on-surface">
              {influencer.full_name}
            </h2>
          </div>

          <div className="flex gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          </div>

          <div className="space-y-3">
            <p className="font-['Inter'] text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Contact
            </p>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-slate-500" />
              </div>
              <a
                href={`mailto:${influencer.email}`}
                className="text-blue-600 hover:underline font-['Inter']"
              >
                {influencer.email}
              </a>
            </div>
            {influencer.phone && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-slate-500" />
                </div>
                <a
                  href={`tel:${influencer.phone}`}
                  className="text-on-surface font-['Inter']"
                >
                  {influencer.phone}
                </a>
              </div>
            )}
          </div>

          {influencer.social_media &&
            Object.keys(influencer.social_media).length > 0 && (
              <div className="space-y-2">
                <p className="font-['Inter'] text-xs font-semibold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5" /> Social Media
                </p>
                <div className="bg-slate-50 rounded-xl px-4 py-3 space-y-1.5 border border-slate-100">
                  {Object.entries(influencer.social_media).map(
                    ([platform, handle]) => (
                      <div
                        key={platform}
                        className="flex items-center gap-2 font-['Inter'] text-sm"
                      >
                        <span className="text-on-surface-variant capitalize">
                          {platform}:
                        </span>
                        <span className="text-on-surface font-medium">
                          {handle}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

          <div className="font-['Inter'] text-xs text-on-surface-variant">
            Submitted on {formatDate(influencer.createdAt)}
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
                <Trash2 className="w-4 h-4" /> Delete Influencer
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

export function DashboardInfluencersPage() {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | Influencer["status"]
  >("all");
  const [selected, setSelected] = useState<Influencer | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllInfluencers();
      setInfluencers(data);
    } catch {
      setError("Failed to load influencers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(
    () => ({
      total: influencers.length,
      pending: influencers.filter((f) => f.status === "pending").length,
      contacted: influencers.filter((f) => f.status === "contacted").length,
      confirmed: influencers.filter((f) => f.status === "confirmed").length,
    }),
    [influencers],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return influencers.filter((f) => {
      const matchSearch =
        !q ||
        f.full_name.toLowerCase().includes(q) ||
        f.email.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || f.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [influencers, search, statusFilter]);

  const handleStatusChange = async (
    id: number,
    status: Influencer["status"],
  ) => {
    setInfluencers((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status } : f)),
    );
    if (selected?.id === id)
      setSelected((prev) => (prev ? { ...prev, status } : prev));
    try {
      await updateInfluencerStatus(id, status);
      showToast(`Status updated to ${STATUS_CONFIG[status].label}`);
    } catch {
      await load();
      showToast("Failed to update status");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteInfluencer(id);
      setInfluencers((prev) => prev.filter((f) => f.id !== id));
      setSelected(null);
      showToast("Influencer deleted");
    } catch {
      showToast("Failed to delete influencer");
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
                  Influencers
                </h2>
                <p className="font-['Inter'] text-sm text-on-surface-variant mt-0.5">
                  Manage influencer applications
                </p>
              </div>
              <div className="flex items-center gap-3">
                <ExportMenu
                  rows={filtered}
                  columns={EXPORT_COLUMNS}
                  filename="influencers"
                  title="Influencers Report"
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
                icon={Briefcase}
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
                        {["#", "Name", "Contact", "", "Status", "Date", ""].map(
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
                              <Briefcase className="w-10 h-10 opacity-30" />
                              <p className="font-['Inter'] text-sm">
                                No influencers found
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filtered.map((f, idx) => {
                          const cfg = STATUS_CONFIG[f.status];
                          return (
                            <motion.tr
                              key={f.id}
                              className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors cursor-pointer group"
                              onClick={() => setSelected(f)}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: idx * 0.03 }}
                            >
                              <td className="px-4 py-4 font-['Inter'] text-sm text-on-surface-variant">
                                {idx + 1}
                              </td>
                              <td className="px-4 py-4 font-['Inter'] text-sm font-semibold text-on-surface">
                                {f.full_name}
                              </td>
                              <td className="px-4 py-4">
                                <div className="font-['Inter'] text-sm text-on-surface">
                                  {f.email}
                                </div>
                                {f.phone && (
                                  <div className="font-['Inter'] text-xs text-on-surface-variant mt-0.5">
                                    {f.phone}
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
                                {formatDate(f.createdAt)}
                              </td>
                              <td className="px-4 py-4">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelected(f);
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
                    Showing {filtered.length} of {influencers.length} influencer
                    {influencers.length !== 1 ? "s" : ""}
                  </p>
                  <div className="flex items-center gap-4">
                    {(["pending", "contacted", "confirmed"] as const).map(
                      (s) => {
                        const c = STATUS_CONFIG[s];
                        const count = influencers.filter(
                          (f) => f.status === s,
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
            influencer={selected}
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
