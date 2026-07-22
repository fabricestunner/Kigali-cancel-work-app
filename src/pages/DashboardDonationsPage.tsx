import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "../components/dashboard/Sidebar";
import { Header } from "../components/dashboard/Header";
import {
  Heart,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Filter,
  X,
  ChevronRight,
  Mail,
  Phone,
  DollarSign,
  Hash,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Copy,
  Check,
} from "lucide-react";
import {
  getAllDonations,
  getDonationStats,
  type Donation,
  type DonationStats,
} from "../services/donation.service";

/* ── helpers ─────────────────────────────────── */
const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
    icon: Clock,
  },
  paid: {
    label: "Paid",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    icon: CheckCircle2,
  },
  failed: {
    label: "Failed",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-400",
    icon: XCircle,
  },
} as const;

const CURRENCY_CONFIG = {
  USD: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  RWF: {
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-200",
  },
};

function formatAmount(amount: string | number, currency: string) {
  const num = Number(amount);
  if (currency === "USD")
    return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M RWF`;
  return `${num.toLocaleString()} RWF`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-RW", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-RW", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ── Skeleton row ────────────────────────────── */
function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100">
      {[...Array(8)].map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div
            className="h-4 bg-slate-100 rounded animate-pulse"
            style={{ width: `${55 + ((i * 13) % 45)}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

/* ── Stat card ───────────────────────────────── */
function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconBg,
  iconColor,
  trend,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  trend?: "up" | "neutral";
}) {
  return (
    <motion.div
      className="bg-white rounded-2xl p-5 shadow-sm border border-outline-variant"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}
        >
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {trend === "up" && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
            <TrendingUp className="w-3 h-3" /> Live
          </div>
        )}
      </div>
      <div className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-on-surface leading-none mb-1 truncate">
        {value}
      </div>
      <div className="font-['Inter'] text-sm text-on-surface-variant">
        {label}
      </div>
      {sub && (
        <div className="font-['Inter'] text-xs text-on-surface-variant/60 mt-0.5">
          {sub}
        </div>
      )}
    </motion.div>
  );
}

/* ── Copy button ─────────────────────────────── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={copy}
      className="p-1 hover:bg-slate-100 rounded transition-colors"
      title="Copy"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-500" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
      )}
    </button>
  );
}

/* ── Detail drawer ───────────────────────────── */
function DetailDrawer({
  donation,
  onClose,
}: {
  donation: Donation;
  onClose: () => void;
}) {
  const cfg = STATUS_CONFIG[donation.status];
  const ccfg = CURRENCY_CONFIG[donation.currency];
  const StatusIcon = cfg.icon;

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
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-secondary" />
            <span className="font-['Plus_Jakarta_Sans'] text-base font-bold text-on-surface">
              Donation Details
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
          {/* Donor identity */}
          <div>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary/80 to-secondary flex items-center justify-center mb-3">
              <span className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-white">
                {donation.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <h2 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-on-surface">
              {donation.full_name}
            </h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
              >
                <StatusIcon className="w-3 h-3" />
                {cfg.label}
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${ccfg.bg} ${ccfg.text} ${ccfg.border}`}
              >
                {donation.currency}
              </span>
            </div>
          </div>

          {/* Amount highlight */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-5 text-center border border-slate-200">
            <p className="font-['Inter'] text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
              Total Donated
            </p>
            <p className="font-['Plus_Jakarta_Sans'] text-4xl font-extrabold text-on-surface tracking-tight">
              {formatAmount(donation.total_amount, donation.currency)}
            </p>
            <p className="font-['Inter'] text-sm text-on-surface-variant mt-1">
              {donation.quantity} voucher{donation.quantity !== 1 ? "s" : ""} ×{" "}
              {formatAmount(donation.amount, donation.currency)} each
            </p>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <p className="font-['Inter'] text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              Contact Info
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-slate-500" />
              </div>
              <a
                href={`mailto:${donation.email}`}
                className="font-['Inter'] text-sm text-blue-600 hover:underline truncate"
              >
                {donation.email}
              </a>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Phone className="w-4 h-4 text-slate-500" />
              </div>
              <span className="font-['Inter'] text-sm text-on-surface">
                {donation.phone}
              </span>
            </div>
          </div>

          {/* Breakdown */}
          <div className="rounded-xl border border-slate-100 overflow-hidden divide-y divide-slate-100">
            {[
              {
                label: "Unit Amount",
                value: formatAmount(donation.amount, donation.currency),
              },
              {
                label: "Vouchers",
                value: `${donation.quantity} voucher${donation.quantity !== 1 ? "s" : ""}`,
              },
              { label: "Currency", value: donation.currency },
              {
                label: "Submitted",
                value: `${formatDate(donation.createdAt)} · ${formatTime(donation.createdAt)}`,
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between px-4 py-3"
              >
                <span className="font-['Inter'] text-xs text-on-surface-variant font-medium">
                  {label}
                </span>
                <span className="font-['Inter'] text-sm text-on-surface font-semibold">
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Payment ref */}
          {donation.payment_ref && (
            <div className="space-y-2">
              <p className="font-['Inter'] text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Payment Reference
              </p>
              <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
                <Hash className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="font-['Inter'] text-sm text-on-surface font-mono flex-1 truncate">
                  {donation.payment_ref}
                </span>
                <CopyButton text={donation.payment_ref} />
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Main page ───────────────────────────────── */
export function DashboardDonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState<DonationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Donation["status"]>(
    "all",
  );
  const [currencyFilter, setCurrencyFilter] = useState<"all" | "USD" | "RWF">(
    "all",
  );
  const [selected, setSelected] = useState<Donation | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, s] = await Promise.all([
        getAllDonations(),
        getDonationStats(),
      ]);
      setDonations(list);
      setStats(s);
    } catch {
      setError("Failed to load donations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, []);

  /* filtered list */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return donations.filter((d) => {
      const matchSearch =
        !q ||
        d.full_name.toLowerCase().includes(q) ||
        d.email.toLowerCase().includes(q) ||
        d.phone.toLowerCase().includes(q) ||
        (d.payment_ref ?? "").toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || d.status === statusFilter;
      const matchCurrency =
        currencyFilter === "all" || d.currency === currencyFilter;
      return matchSearch && matchStatus && matchCurrency;
    });
  }, [donations, search, statusFilter, currencyFilter]);

  /* computed totals from local data */
  const localStats = useMemo(
    () => ({
      total: donations.length,
      paid: donations.filter((d) => d.status === "paid").length,
      pending: donations.filter((d) => d.status === "pending").length,
      failed: donations.filter((d) => d.status === "failed").length,
    }),
    [donations],
  );

  const paidRate =
    localStats.total > 0
      ? Math.round((localStats.paid / localStats.total) * 100)
      : 0;

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
                  Donations
                </h2>
                <p className="font-['Inter'] text-sm text-on-surface-variant mt-0.5">
                  Track and manage all donation payments
                </p>
              </div>
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

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Donations"
                value={loading ? "—" : localStats.total}
                sub={`${paidRate}% conversion rate`}
                icon={Heart}
                iconBg="bg-secondary/10"
                iconColor="text-secondary"
                trend="up"
              />
              <StatCard
                label="Paid"
                value={loading ? "—" : localStats.paid}
                sub={`${localStats.pending} pending`}
                icon={CheckCircle2}
                iconBg="bg-emerald-100"
                iconColor="text-emerald-600"
              />
              <StatCard
                label="Total USD Raised"
                value={
                  loading || !stats
                    ? "—"
                    : `$${Number(stats.totalUSD).toLocaleString("en-US", { minimumFractionDigits: 0 })}`
                }
                sub="from paid donations"
                icon={DollarSign}
                iconBg="bg-blue-100"
                iconColor="text-blue-600"
              />
              <StatCard
                label="Total RWF Raised"
                value={
                  loading || !stats ? "—" : formatAmount(stats.totalRWF, "RWF")
                }
                sub="from paid donations"
                icon={TrendingUp}
                iconBg="bg-violet-100"
                iconColor="text-violet-600"
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
                    placeholder="Search by name, email, phone or ref…"
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
                    onChange={(e) =>
                      setStatusFilter(e.target.value as typeof statusFilter)
                    }
                    className="bg-surface-container border border-outline-variant rounded-xl px-3 py-2.5 font-['Inter'] text-sm text-on-surface outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                {/* Currency filter */}
                <select
                  value={currencyFilter}
                  onChange={(e) =>
                    setCurrencyFilter(e.target.value as typeof currencyFilter)
                  }
                  className="bg-surface-container border border-outline-variant rounded-xl px-3 py-2.5 font-['Inter'] text-sm text-on-surface outline-none"
                >
                  <option value="all">All Currencies</option>
                  <option value="USD">USD</option>
                  <option value="RWF">RWF</option>
                </select>

                {/* Result count */}
                <div className="flex items-center justify-center px-3 py-2.5 rounded-xl bg-secondary/10 font-['Inter'] text-sm font-semibold text-secondary whitespace-nowrap">
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
                  <button
                    onClick={load}
                    className="text-secondary font-['Inter'] text-sm font-semibold hover:underline"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        {[
                          "#",
                          "Donor",
                          "Contact",
                          "Total",
                          "Vouchers",
                          "Currency",
                          "Status",
                          "Date",
                          "",
                        ].map((h) => (
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
                        [...Array(6)].map((_, i) => <SkeletonRow key={i} />)
                      ) : filtered.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-4 py-16 text-center">
                            <div className="flex flex-col items-center gap-2 text-on-surface-variant">
                              <Heart className="w-10 h-10 opacity-30" />
                              <p className="font-['Inter'] text-sm">
                                No donations found
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filtered.map((d, idx) => {
                          const cfg = STATUS_CONFIG[d.status];
                          const ccfg = CURRENCY_CONFIG[d.currency];
                          return (
                            <motion.tr
                              key={d.id}
                              className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors cursor-pointer group"
                              onClick={() => setSelected(d)}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: idx * 0.025 }}
                            >
                              <td className="px-4 py-4 font-['Inter'] text-sm text-on-surface-variant">
                                {idx + 1}
                              </td>
                              <td className="px-4 py-4">
                                <div className="font-['Inter'] text-sm font-semibold text-on-surface">
                                  {d.full_name}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="font-['Inter'] text-sm text-on-surface">
                                  {d.email}
                                </div>
                                <div className="font-['Inter'] text-xs text-on-surface-variant mt-0.5">
                                  {d.phone}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <span className="font-['Plus_Jakarta_Sans'] text-sm font-bold text-on-surface">
                                  {formatAmount(d.total_amount, d.currency)}
                                </span>
                              </td>
                              <td className="px-4 py-4 font-['Inter'] text-sm text-on-surface text-center">
                                {d.quantity}
                              </td>
                              <td className="px-4 py-4">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${ccfg.bg} ${ccfg.text} ${ccfg.border}`}
                                >
                                  {d.currency}
                                </span>
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
                                <div>{formatDate(d.createdAt)}</div>
                                <div className="text-xs text-on-surface-variant/60">
                                  {formatTime(d.createdAt)}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelected(d);
                                  }}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary/10 text-secondary font-['Inter'] text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-secondary/20"
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

              {/* Table footer */}
              {!loading && !error && filtered.length > 0 && (
                <div className="px-4 py-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <p className="font-['Inter'] text-xs text-on-surface-variant">
                    Showing {filtered.length} of {donations.length} donation
                    {donations.length !== 1 ? "s" : ""}
                  </p>
                  <div className="flex items-center gap-4">
                    {(["paid", "pending", "failed"] as const).map((s) => {
                      const c = STATUS_CONFIG[s];
                      const count = donations.filter(
                        (d) => d.status === s,
                      ).length;
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

            {/* Currency breakdown cards */}
            {!loading && !error && donations.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(["USD", "RWF"] as const).map((cur) => {
                  const curDons = donations.filter((d) => d.currency === cur);
                  const paid = curDons.filter((d) => d.status === "paid");
                  const total = paid.reduce(
                    (s, d) => s + Number(d.total_amount),
                    0,
                  );
                  const ccfg = CURRENCY_CONFIG[cur];
                  return (
                    <div
                      key={cur}
                      className="bg-white rounded-2xl p-5 shadow-sm border border-outline-variant"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${ccfg.bg} ${ccfg.text} ${ccfg.border}`}
                        >
                          {cur} Donations
                        </span>
                        <span className="font-['Inter'] text-sm text-on-surface-variant">
                          {curDons.length} total
                        </span>
                      </div>
                      <div className="font-['Plus_Jakarta_Sans'] text-3xl font-extrabold text-on-surface mb-1">
                        {formatAmount(total, cur)}
                      </div>
                      <p className="font-['Inter'] text-xs text-on-surface-variant">
                        from {paid.length} paid donation
                        {paid.length !== 1 ? "s" : ""}
                      </p>
                      {curDons.length > 0 && (
                        <div className="mt-4">
                          <div className="flex justify-between font-['Inter'] text-xs text-on-surface-variant mb-1.5">
                            <span>Conversion</span>
                            <span>
                              {Math.round((paid.length / curDons.length) * 100)}
                              %
                            </span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${cur === "USD" ? "bg-blue-500" : "bg-violet-500"}`}
                              initial={{ width: 0 }}
                              animate={{
                                width: `${Math.round((paid.length / curDons.length) * 100)}%`,
                              }}
                              transition={{ duration: 0.8, delay: 0.3 }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Detail drawer */}
      <AnimatePresence>
        {selected && (
          <DetailDrawer donation={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
