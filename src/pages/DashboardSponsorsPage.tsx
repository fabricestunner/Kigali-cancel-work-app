import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "../components/dashboard/Sidebar";
import { Header } from "../components/dashboard/Header";
import {
  Handshake,
  Clock,
  PhoneCall,
  CheckCircle2,
  Search,
  Filter,
  X,
  ChevronRight,
  Mail,
  Phone,
  Building2,
  MessageSquare,
  TrendingUp,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { getAllSponsors, updateSponsorStatus, type Sponsor } from "../services/sponsor.service";

/* ── helpers ─────────────────────────────────── */
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
  completed: {
    label: "Completed",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
} as const;

const PACKAGE_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
  "5M FRW":  { bg: "bg-slate-50",  text: "text-slate-700",  border: "border-slate-200" },
  "15M FRW": { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200" },
  "25M FRW": { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  "30M FRW": { bg: "bg-rose-50",   text: "text-rose-700",   border: "border-rose-200"  },
};

function formatFRW(amount: number) {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(0)}M FRW`;
  return `${amount.toLocaleString()} FRW`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-RW", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* ── Skeleton row ────────────────────────────── */
function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100">
      {[...Array(7)].map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: `${60 + (i * 15) % 40}%` }} />
        </td>
      ))}
    </tr>
  );
}

/* ── Stat card ───────────────────────────────── */
function StatCard({
  label, value, icon: Icon, color, sub,
}: {
  label: string; value: string | number; icon: React.ElementType;
  color: string; sub?: string;
}) {
  return (
    <motion.div
      className="bg-white rounded-2xl p-5 shadow-sm border border-outline-variant"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-on-surface leading-none mb-1">
        {value}
      </div>
      <div className="font-['Inter'] text-sm text-on-surface-variant">{label}</div>
      {sub && <div className="font-['Inter'] text-xs text-on-surface-variant/60 mt-0.5">{sub}</div>}
    </motion.div>
  );
}

/* ── Detail drawer ───────────────────────────── */
function DetailDrawer({
  sponsor,
  onClose,
  onStatusChange,
}: {
  sponsor: Sponsor;
  onClose: () => void;
  onStatusChange: (id: number, status: Sponsor["status"]) => Promise<void>;
}) {
  const [updating, setUpdating] = useState<Sponsor["status"] | null>(null);
  const cfg = STATUS_CONFIG[sponsor.status];
  const pkgCfg = PACKAGE_CONFIG[sponsor.package_label] ?? PACKAGE_CONFIG["5M FRW"];

  const nextStatuses: Sponsor["status"][] = (["pending", "contacted", "completed"] as const).filter(
    (s) => s !== sponsor.status,
  );

  const handleStatus = async (s: Sponsor["status"]) => {
    setUpdating(s);
    await onStatusChange(sponsor.id, s);
    setUpdating(null);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      {/* panel */}
      <motion.div
        className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-y-auto"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Handshake className="w-5 h-5 text-secondary" />
            <span className="font-['Plus_Jakarta_Sans'] text-base font-bold text-on-surface">
              Sponsor Details
            </span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1">
          {/* Identity */}
          <div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-3">
              <span className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-white">
                {sponsor.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <h2 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-on-surface">
              {sponsor.full_name}
            </h2>
            {sponsor.company_name && (
              <p className="font-['Inter'] text-sm text-on-surface-variant mt-0.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                {sponsor.company_name}
              </p>
            )}
          </div>

          {/* Status + Package */}
          <div className="flex gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${pkgCfg.bg} ${pkgCfg.text} ${pkgCfg.border}`}>
              {sponsor.package_label}
            </span>
          </div>

          {/* Contact info */}
          <div className="space-y-3">
            <p className="font-['Inter'] text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Contact
            </p>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-slate-500" />
              </div>
              <a href={`mailto:${sponsor.email}`} className="text-blue-600 hover:underline font-['Inter']">
                {sponsor.email}
              </a>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Phone className="w-4 h-4 text-slate-500" />
              </div>
              <a href={`tel:${sponsor.phone}`} className="text-on-surface font-['Inter']">
                {sponsor.phone}
              </a>
            </div>
          </div>

          {/* Message */}
          {sponsor.message && (
            <div className="space-y-2">
              <p className="font-['Inter'] text-xs font-semibold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" /> Message
              </p>
              <div className="bg-slate-50 rounded-xl px-4 py-3 font-['Inter'] text-sm text-on-surface leading-relaxed border border-slate-100">
                {sponsor.message}
              </div>
            </div>
          )}

          {/* Date */}
          <div className="font-['Inter'] text-xs text-on-surface-variant">
            Submitted on {formatDate(sponsor.createdAt)}
          </div>

          {/* Status actions */}
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
                        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                      />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Main page ───────────────────────────────── */
export function DashboardSponsorsPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Sponsor["status"]>("all");
  const [packageFilter, setPackageFilter] = useState("all");
  const [selected, setSelected] = useState<Sponsor | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllSponsors();
      setSponsors(data);
    } catch {
      setError("Failed to load sponsors. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, []);

  /* stats */
  const stats = useMemo(() => {
    const total = sponsors.length;
    const pending = sponsors.filter((s) => s.status === "pending").length;
    const contacted = sponsors.filter((s) => s.status === "contacted").length;
    const completed = sponsors.filter((s) => s.status === "completed").length;
    const value = sponsors.reduce((sum, s) => sum + Number(s.package_amount), 0);
    return { total, pending, contacted, completed, value };
  }, [sponsors]);

  /* filtered list */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return sponsors.filter((s) => {
      const matchSearch =
        !q ||
        s.full_name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.company_name ?? "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      const matchPkg = packageFilter === "all" || s.package_label === packageFilter;
      return matchSearch && matchStatus && matchPkg;
    });
  }, [sponsors, search, statusFilter, packageFilter]);

  /* optimistic status update */
  const handleStatusChange = async (id: number, status: Sponsor["status"]) => {
    setSponsors((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s)),
    );
    if (selected?.id === id) setSelected((prev) => prev ? { ...prev, status } : prev);
    try {
      await updateSponsorStatus(id, status);
      showToast(`Status updated to ${STATUS_CONFIG[status].label}`);
    } catch {
      await load();
      showToast("Failed to update status");
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const uniquePackages = useMemo(
    () => [...new Set(sponsors.map((s) => s.package_label))],
    [sponsors],
  );

  return (
    <div className="min-h-screen bg-surface flex">
      <Sidebar />

      <div className="flex-1 lg:ml-64 flex flex-col">
        <Header />

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* Page title */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-on-surface">
                  Sponsors
                </h2>
                <p className="font-['Inter'] text-sm text-on-surface-variant mt-0.5">
                  Manage corporate sponsorship applications
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

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Applications"
                value={stats.total}
                icon={Handshake}
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
                sub={`${stats.completed} completed`}
              />
              <StatCard
                label="Est. Total Value"
                value={formatFRW(stats.value)}
                icon={TrendingUp}
                color="bg-emerald-100 text-emerald-600"
              />
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-outline-variant p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="flex-1 flex items-center gap-2 bg-surface-container rounded-xl px-4 py-2.5 border border-outline-variant">
                  <Search className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search by name, email or company…"
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

                {/* Status filter */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                    className="bg-surface-container border border-outline-variant rounded-xl px-3 py-2.5 font-['Inter'] text-sm text-on-surface outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="contacted">Contacted</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                {/* Package filter */}
                <select
                  value={packageFilter}
                  onChange={(e) => setPackageFilter(e.target.value)}
                  className="bg-surface-container border border-outline-variant rounded-xl px-3 py-2.5 font-['Inter'] text-sm text-on-surface outline-none"
                >
                  <option value="all">All Packages</option>
                  {uniquePackages.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>

                {/* Count badge */}
                <div className="flex items-center justify-center px-3 py-2.5 rounded-xl bg-primary/10 font-['Inter'] text-sm font-semibold text-primary whitespace-nowrap">
                  {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-outline-variant overflow-hidden">
              {error ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-on-surface-variant">
                  <AlertCircle className="w-10 h-10 text-red-400" />
                  <p className="font-['Inter'] text-sm">{error}</p>
                  <button onClick={load} className="text-primary font-['Inter'] text-sm font-semibold hover:underline">
                    Retry
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        {["#", "Sponsor", "Contact", "Package", "Status", "Date", ""].map((h) => (
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
                      {loading
                        ? [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                        : filtered.length === 0
                        ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-16 text-center">
                              <div className="flex flex-col items-center gap-2 text-on-surface-variant">
                                <Handshake className="w-10 h-10 opacity-30" />
                                <p className="font-['Inter'] text-sm">No sponsors found</p>
                              </div>
                            </td>
                          </tr>
                        )
                        : filtered.map((s, idx) => {
                          const cfg = STATUS_CONFIG[s.status];
                          const pkgCfg = PACKAGE_CONFIG[s.package_label] ?? PACKAGE_CONFIG["5M FRW"];
                          return (
                            <motion.tr
                              key={s.id}
                              className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors cursor-pointer group"
                              onClick={() => setSelected(s)}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: idx * 0.03 }}
                            >
                              <td className="px-4 py-4 font-['Inter'] text-sm text-on-surface-variant">
                                {idx + 1}
                              </td>
                              <td className="px-4 py-4">
                                <div className="font-['Inter'] text-sm font-semibold text-on-surface">
                                  {s.full_name}
                                </div>
                                {s.company_name && (
                                  <div className="font-['Inter'] text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                                    <Building2 className="w-3 h-3" />
                                    {s.company_name}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-4">
                                <div className="font-['Inter'] text-sm text-on-surface">{s.email}</div>
                                <div className="font-['Inter'] text-xs text-on-surface-variant mt-0.5">{s.phone}</div>
                              </td>
                              <td className="px-4 py-4">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${pkgCfg.bg} ${pkgCfg.text} ${pkgCfg.border}`}>
                                  {s.package_label}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                  {cfg.label}
                                </span>
                              </td>
                              <td className="px-4 py-4 font-['Inter'] text-sm text-on-surface-variant whitespace-nowrap">
                                {formatDate(s.createdAt)}
                              </td>
                              <td className="px-4 py-4">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setSelected(s); }}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-['Inter'] text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/20"
                                >
                                  View <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </motion.tr>
                          );
                        })
                      }
                    </tbody>
                  </table>
                </div>
              )}

              {/* Table footer */}
              {!loading && !error && filtered.length > 0 && (
                <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
                  <p className="font-['Inter'] text-xs text-on-surface-variant">
                    Showing {filtered.length} of {sponsors.length} sponsor{sponsors.length !== 1 ? "s" : ""}
                  </p>
                  <div className="flex items-center gap-4">
                    {(["pending", "contacted", "completed"] as const).map((s) => {
                      const c = STATUS_CONFIG[s];
                      const count = sponsors.filter((sp) => sp.status === s).length;
                      return (
                        <div key={s} className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                          <span className="font-['Inter'] text-xs text-on-surface-variant">
                            {count} {c.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>

      {/* Detail drawer */}
      <AnimatePresence>
        {selected && (
          <DetailDrawer
            sponsor={selected}
            onClose={() => setSelected(null)}
            onStatusChange={handleStatusChange}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
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
