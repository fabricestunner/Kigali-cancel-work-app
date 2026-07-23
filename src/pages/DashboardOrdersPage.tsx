import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { Sidebar } from "../components/dashboard/Sidebar";
import { Header } from "../components/dashboard/Header";
import {
  Shirt,
  Search,
  Filter,
  X,
  RefreshCw,
  AlertCircle,
  Eye,
  CheckCircle,
  Circle,
  Ban,
  UsersRound,
  Ticket,
  Send,
} from "lucide-react";
import api from "../services/api";
import type { Order } from "../hooks/useDashboardData";
import { OrderModal } from "../components/dashboard/RecentOrdersTable";
import {
  STATUS_STYLES,
  STATUS_LABELS,
  isPaid,
} from "../components/dashboard/recentOrders.helpers";
import { getAllBuddyGroups, type BuddyGroup } from "../services/buddygroup.service";
import { markOrderCollected } from "../services/order.service";
import {
  backfillOrder,
  backfillAll,
  resendTickets,
  type BackfillAllResult,
} from "../services/ticket.service";
import {
  collectionState,
  groupByPaymentRef,
  type CollectionStateValue,
  type CollectionSummary,
} from "../utils/collection";
import { ExportMenu } from "../components/dashboard/ExportMenu";
import {
  toWorkbookSheet,
  type ExportColumn,
  type WorkbookSheet,
} from "../utils/exportData";

const COLLECTION_STATE_LABELS: Record<CollectionStateValue, string> = {
  collected: "Collected",
  partial: "Partial",
  awaiting: "Awaiting collection",
  "not-payable": "Not payable",
};

const orderGroupKey = (o: Order) => o.payment_ref ?? `#${o.id}`;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-RW", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatAmount(amount: string | number, currency: string) {
  const num = typeof amount === "number" ? amount : Number(amount);
  return `${currency} ${num.toLocaleString("en-US")}`;
}

const ORDER_EXPORT_COLUMNS: ExportColumn<Order>[] = [
  { header: "Ref", value: (o) => o.payment_ref ?? `#${o.id}`, width: 16 },
  { header: "Participant", value: (o) => o.full_name, width: 26 },
  { header: "Email", value: (o) => o.email, width: 30 },
  { header: "Item", value: (o) => o.stock?.item ?? "—", width: 18 },
  { header: "Qty", value: (o) => o.quantity, width: 8 },
  { header: "Amount", value: (o) => Number(o.amount_paid), width: 14 },
  { header: "Currency", value: (o) => o.currency, width: 10 },
  { header: "Status", value: (o) => STATUS_LABELS[o.status] ?? o.status, width: 18 },
  { header: "Collected", value: (o) => (o.collected ? "Yes" : "No"), width: 12 },
  {
    header: "Collected At",
    value: (o) => (o.collected_at ? formatDate(o.collected_at) : "—"),
    width: 16,
  },
  { header: "Date", value: (o) => formatDate(o.createdAt), width: 16 },
];

/** Sum of amount_paid across rows, formatted with the currency of the first
 * row (the event runs a single currency in practice; falls back to a bare
 * number when the group is empty). */
function sumAmounts(rows: Order[]): string {
  if (rows.length === 0) return "0";
  const total = rows.reduce((sum, o) => sum + Number(o.amount_paid), 0);
  return `${rows[0].currency} ${total.toLocaleString("en-US")}`;
}

const SUMMARY_COLUMNS: ExportColumn<{ label: string; count: number; revenue: string }>[] = [
  { header: "Metric", value: (r) => r.label, width: 24 },
  { header: "Count", value: (r) => r.count, width: 10 },
  { header: "Revenue", value: (r) => r.revenue, width: 18 },
];

/**
 * Builds the multi-sheet order export: one tab per payment status plus a
 * Summary tab, matching the "Export" section of the order-collection design
 * spec. Every sheet is written even when empty — a missing tab reads as a
 * bug, an empty one reads as an answer.
 */
function buildOrdersWorkbook(orders: Order[]): WorkbookSheet[] {
  const byStatus = (status: string) => orders.filter((o) => o.status === status);

  const paid = byStatus("paid");
  const backorder = byStatus("paid_backorder");
  const pending = byStatus("pending");
  const failed = byStatus("failed");
  const collected = paid.filter((o) => o.collected);
  const awaiting = paid.filter((o) => !o.collected);

  const summaryRows = [
    { label: "Pending", count: pending.length, revenue: sumAmounts(pending) },
    { label: "Paid", count: paid.length, revenue: sumAmounts(paid) },
    {
      label: "Paid · Backorder",
      count: backorder.length,
      revenue: sumAmounts(backorder),
    },
    { label: "Failed", count: failed.length, revenue: sumAmounts(failed) },
    { label: "Collected", count: collected.length, revenue: sumAmounts(collected) },
    {
      label: "Awaiting collection",
      count: awaiting.length,
      revenue: sumAmounts(awaiting),
    },
  ];

  return [
    toWorkbookSheet("Summary", SUMMARY_COLUMNS, summaryRows),
    toWorkbookSheet("Paid", ORDER_EXPORT_COLUMNS, paid),
    toWorkbookSheet("Collected", ORDER_EXPORT_COLUMNS, collected),
    toWorkbookSheet("Awaiting collection", ORDER_EXPORT_COLUMNS, awaiting),
    toWorkbookSheet("Backorder", ORDER_EXPORT_COLUMNS, backorder),
    toWorkbookSheet("Pending", ORDER_EXPORT_COLUMNS, pending),
    toWorkbookSheet("Failed", ORDER_EXPORT_COLUMNS, failed),
  ];
}

/** Pulls the server's `{ message }` off an Axios error, falling back to a
 * generic message only when the server didn't send one. The 409 (unpaid),
 * 404 (resend before generate) and 503 (signing key unset) responses are all
 * informative on their own — always prefer them over a generic failure. */
function extractErrorMessage(err: unknown, fallback: string): string {
  return axios.isAxiosError(err)
    ? ((err.response?.data as { message?: string } | undefined)?.message ?? fallback)
    : fallback;
}

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100">
      {[...Array(10)].map((_, i) => (
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

export function DashboardOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [buddyGroups, setBuddyGroups] = useState<BuddyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  // "all" | "none" | a buddy group id as string
  const [buddyFilter, setBuddyFilter] = useState("all");
  const [selected, setSelected] = useState<Order | null>(null);
  const [marking, setMarking] = useState(false);
  const [collectionFilter, setCollectionFilter] = useState<"all" | CollectionStateValue>("all");
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [collectError, setCollectError] = useState<string | null>(null);
  const [ticketActionId, setTicketActionId] = useState<number | null>(null);
  const [ticketActionError, setTicketActionError] = useState<string | null>(null);
  const [generateAllConfirming, setGenerateAllConfirming] = useState(false);
  const [generateAllBusy, setGenerateAllBusy] = useState(false);
  const [generateAllResult, setGenerateAllResult] = useState<BackfillAllResult | null>(null);
  const [generateAllError, setGenerateAllError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query =
        buddyFilter === "all" ? "" : `?buddy_group_id=${buddyFilter}`;
      const [orderRes, groups] = await Promise.all([
        api.get<Order[]>(`/payment/orders${query}`),
        getAllBuddyGroups().catch(() => [] as BuddyGroup[]),
      ]);
      setOrders(orderRes.data);
      setBuddyGroups(groups);
    } catch {
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [buddyFilter]);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return orders.filter((o) => {
      const matchesSearch =
        !q ||
        o.full_name.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q) ||
        (o.payment_ref ?? "").toLowerCase().includes(q);

      const matchesCollection =
        collectionFilter === "all" ||
        collectionState([o]).state === collectionFilter;

      return matchesSearch && matchesCollection;
    });
  }, [orders, search, collectionFilter]);

  // Roll-up per customer. The backend writes one row per cart line, so a buyer
  // of four kits in two sizes has two rows sharing a payment_ref; the group
  // summary is what tells staff whether that buyer is fully served.
  const groups = useMemo(() => groupByPaymentRef(orders), [orders]);

  const groupSummary = useCallback(
    (order: Order): CollectionSummary => collectionState(groups[orderGroupKey(order)] ?? [order]),
    [groups],
  );

  // Always built from the full, unfiltered order set — the workbook answers
  // "who has paid but not collected?" across every order, not just the
  // current search/filter view.
  const workbookSheets = useMemo(() => buildOrdersWorkbook(orders), [orders]);

  // Paid orders with no tickets yet, from the full loaded set — what "Generate
  // all tickets" is about to act on.
  const pendingTicketCount = useMemo(
    () => orders.filter((o) => isPaid(o.status) && (o._count?.tickets ?? 0) === 0).length,
    [orders],
  );

  const handleToggleCollected = async (order: Order) => {
    setTogglingId(order.id);
    setCollectError(null);
    try {
      await markOrderCollected(order.id, !order.collected);
      await load();
    } catch (err) {
      // The server refuses an unpaid order with 409 and an explanation. Show
      // its message rather than a generic failure — the reason is the point.
      setCollectError(extractErrorMessage(err, "Could not update collection status."));
    } finally {
      setTogglingId(null);
    }
  };

  const handleMarkPaid = async (order: Order) => {
    setMarking(true);
    try {
      await api.patch(`/payment/orders/${order.id}/status`, { status: "paid" });
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: "paid" } : o)),
      );
      setSelected((prev) => (prev ? { ...prev, status: "paid" } : null));
    } catch {
      alert("Failed to update order status. Please try again.");
    } finally {
      setMarking(false);
    }
  };

  const handleGenerateTickets = async (order: Order) => {
    setTicketActionId(order.id);
    setTicketActionError(null);
    try {
      await backfillOrder(order.id);
      await load();
    } catch (err) {
      // 409 (unpaid) and 503 (signing key unset) both carry the reason.
      setTicketActionError(
        `${order.payment_ref ?? `#${order.id}`}: ${extractErrorMessage(err, "Could not generate tickets.")}`,
      );
    } finally {
      setTicketActionId(null);
    }
  };

  const handleResendTickets = async (order: Order) => {
    setTicketActionId(order.id);
    setTicketActionError(null);
    try {
      await resendTickets(order.id);
    } catch (err) {
      // 404 fires when tickets haven't been generated yet — the message says so.
      setTicketActionError(
        `${order.payment_ref ?? `#${order.id}`}: ${extractErrorMessage(err, "Could not resend tickets.")}`,
      );
    } finally {
      setTicketActionId(null);
    }
  };

  const handleGenerateAll = async () => {
    setGenerateAllBusy(true);
    setGenerateAllError(null);
    try {
      const result = await backfillAll();
      setGenerateAllResult(result);
      setGenerateAllConfirming(false);
      await load();
    } catch (err) {
      setGenerateAllError(extractErrorMessage(err, "Could not generate tickets."));
    } finally {
      setGenerateAllBusy(false);
    }
  };

  const collectionLabel = (o: Order) =>
    o.delivery_option === "delivery"
      ? `Delivery → ${o.location}`
      : o.delivery_option === "buddy"
        ? o.location
        : `Pickup at ${o.location}`;

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
                  Kit Orders
                </h2>
                <p className="font-['Inter'] text-sm text-on-surface-variant mt-0.5">
                  Latest kit orders, filterable by buddy group
                </p>
              </div>
              <div className="flex items-center gap-3">
                <ExportMenu
                  rows={filtered}
                  columns={ORDER_EXPORT_COLUMNS}
                  filename="orders"
                  title="Kit Orders Report"
                  disabled={loading}
                  workbookSheets={workbookSheets}
                  workbookLabel="Download Status Workbook"
                  workbookHint="Summary + one sheet per status (.xlsx)"
                />
                <button
                  onClick={() => {
                    setGenerateAllConfirming(true);
                    setGenerateAllResult(null);
                    setGenerateAllError(null);
                  }}
                  disabled={loading || pendingTicketCount === 0}
                  title={
                    pendingTicketCount === 0
                      ? "Every paid order already has tickets"
                      : `${pendingTicketCount} paid order(s) have no tickets yet`
                  }
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-['Inter'] font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Ticket className="w-4 h-4" />
                  Generate all tickets
                  {pendingTicketCount > 0 ? ` (${pendingTicketCount})` : ""}
                </button>
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

            {generateAllConfirming && (
              <div className="bg-primary-container/40 border border-primary/30 rounded-2xl p-4 flex flex-col gap-3">
                <p className="font-['Inter'] text-sm text-on-surface">
                  Generate tickets for {pendingTicketCount} paid order
                  {pendingTicketCount !== 1 ? "s" : ""} and email them?
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateAll}
                    disabled={generateAllBusy}
                    className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-['Inter'] font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {generateAllBusy ? "Generating…" : "Confirm"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenerateAllConfirming(false)}
                    disabled={generateAllBusy}
                    className="px-4 py-2 rounded-xl bg-white border border-outline-variant text-sm font-['Inter'] font-semibold text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {generateAllError && (
              <div className="flex items-start gap-2 rounded-2xl border border-error/30 bg-error/10 px-4 py-3">
                <AlertCircle className="w-4 h-4 text-error flex-shrink-0 mt-0.5" />
                <p className="font-['Inter'] text-sm text-error">{generateAllError}</p>
              </div>
            )}

            {generateAllResult && (
              <div className="bg-white border border-outline-variant rounded-2xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-['Inter'] text-sm font-semibold text-on-surface">
                    Processed {generateAllResult.ordersProcessed} order(s):{" "}
                    {generateAllResult.ticketsIssued} ticket(s) issued,{" "}
                    {generateAllResult.skipped} already had tickets
                    {generateAllResult.failed.length > 0
                      ? `, ${generateAllResult.failed.length} failed`
                      : ""}
                    .
                  </p>
                  <button
                    type="button"
                    onClick={() => setGenerateAllResult(null)}
                    title="Dismiss"
                    className="text-on-surface-variant hover:text-on-surface flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {generateAllResult.failed.length > 0 && (
                  <ul className="space-y-1">
                    {generateAllResult.failed.map((f) => (
                      <li key={f.orderId} className="font-['Inter'] text-xs text-error">
                        Order #{f.orderId}: {f.reason}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-outline-variant p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 flex items-center gap-2 bg-surface-container rounded-xl px-4 py-2.5 border border-outline-variant">
                  <Search className="w-4 h-4 text-on-surface-variant flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search by name, email or reference…"
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
                    value={buddyFilter}
                    onChange={(e) => setBuddyFilter(e.target.value)}
                    className="bg-surface-container border border-outline-variant rounded-xl px-3 py-2.5 font-['Inter'] text-sm text-on-surface outline-none"
                  >
                    <option value="all">All Orders</option>
                    <option value="none">No Buddy Group</option>
                    {buddyGroups.map((g) => (
                      <option key={g.id} value={String(g.id)}>
                        Buddy: {g.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={collectionFilter}
                    onChange={(e) =>
                      setCollectionFilter(e.target.value as "all" | CollectionStateValue)
                    }
                    className="bg-surface-container border border-outline-variant rounded-xl px-3 py-2.5 font-['Inter'] text-sm text-on-surface outline-none"
                  >
                    <option value="all">Any collection state</option>
                    <option value="awaiting">Awaiting collection</option>
                    <option value="collected">Collected</option>
                    <option value="not-payable">Not payable</option>
                  </select>
                </div>
                <div className="flex items-center justify-center px-3 py-2.5 rounded-xl bg-primary/10 font-['Inter'] text-sm font-semibold text-primary whitespace-nowrap">
                  {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                </div>
              </div>
              {collectError && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-error/30 bg-error/10 px-3 py-2.5">
                  <AlertCircle className="w-4 h-4 text-error flex-shrink-0 mt-0.5" />
                  <p className="font-['Inter'] text-sm text-error">{collectError}</p>
                </div>
              )}
              {ticketActionError && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-error/30 bg-error/10 px-3 py-2.5">
                  <AlertCircle className="w-4 h-4 text-error flex-shrink-0 mt-0.5" />
                  <p className="font-['Inter'] text-sm text-error">{ticketActionError}</p>
                </div>
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
                        {[
                          "Ref",
                          "Participant",
                          "Item",
                          "Qty",
                          "Amount",
                          "Collection",
                          "Collected",
                          "Status",
                          "Date",
                          "",
                        ].map((h) => (
                          <th
                            key={h}
                            className={`px-4 py-3.5 font-['Inter'] text-xs font-semibold text-on-surface-variant uppercase tracking-wider whitespace-nowrap ${
                              h === "Qty" || h === "Amount"
                                ? "text-right"
                                : "text-left"
                            }`}
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
                          <td colSpan={10} className="px-4 py-16 text-center">
                            <div className="flex flex-col items-center gap-2 text-on-surface-variant">
                              <Shirt className="w-10 h-10 opacity-30" />
                              <p className="font-['Inter'] text-sm">
                                No orders found
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filtered.map((order, idx) => (
                          <motion.tr
                            key={order.id}
                            className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.02 }}
                          >
                            <td className="px-4 py-4 font-['Inter'] text-xs font-medium text-primary max-w-[110px] truncate">
                              {order.payment_ref ?? `#${order.id}`}
                            </td>
                            <td className="px-4 py-4">
                              <div className="font-['Inter'] text-sm font-semibold text-on-surface">
                                {order.full_name}
                              </div>
                              <div className="font-['Inter'] text-xs text-on-surface-variant mt-0.5">
                                {order.email}
                              </div>
                            </td>
                            <td className="px-4 py-4 font-['Inter'] text-sm text-on-surface-variant max-w-[90px] truncate">
                              {order.stock?.item ?? "—"}
                            </td>
                            <td className="px-4 py-4 font-['Inter'] text-sm text-on-surface text-right">
                              {order.quantity}
                            </td>
                            <td className="px-4 py-4 font-['Inter'] text-sm text-on-surface text-right whitespace-nowrap">
                              {formatAmount(order.amount_paid, order.currency)}
                            </td>
                            <td className="px-4 py-4">
                              {order.buddy_group ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-violet-50 text-violet-700 border-violet-200">
                                  <UsersRound className="w-3 h-3" />
                                  {order.buddy_group.name}
                                </span>
                              ) : (
                                <span className="font-['Inter'] text-xs text-on-surface-variant">
                                  {collectionLabel(order)}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              {(() => {
                                const payable = isPaid(order.status);
                                const summary = groupSummary(order);
                                return (
                                  <div className="flex flex-col gap-1">
                                    <button
                                      type="button"
                                      disabled={!payable || togglingId === order.id}
                                      onClick={() => handleToggleCollected(order)}
                                      title={
                                        payable
                                          ? order.collected
                                            ? "Mark as not collected"
                                            : "Mark as collected"
                                          : "This order has not been paid for"
                                      }
                                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                                        !payable
                                          ? "bg-surface-container text-on-surface-variant border-outline-variant cursor-not-allowed"
                                          : order.collected
                                            ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                            : "bg-surface-container text-on-surface-variant border-outline-variant hover:bg-primary-container"
                                      }`}
                                    >
                                      {!payable ? (
                                        <Ban className="w-3 h-3" />
                                      ) : order.collected ? (
                                        <CheckCircle className="w-3 h-3" />
                                      ) : (
                                        <Circle className="w-3 h-3" />
                                      )}
                                      {!payable
                                        ? COLLECTION_STATE_LABELS["not-payable"]
                                        : order.collected
                                          ? "Collected"
                                          : "Awaiting"}
                                    </button>
                                    {payable && summary.total > 1 && (
                                      <span className="font-['Inter'] text-[11px] text-on-surface-variant">
                                        {summary.state === "partial"
                                          ? `Partial (${summary.collected}/${summary.total})`
                                          : `${COLLECTION_STATE_LABELS[summary.state]} (${summary.collected}/${summary.total})`}
                                      </span>
                                    )}
                                    {order.collected && order.collected_at && (
                                      <span className="font-['Inter'] text-[11px] text-on-surface-variant">
                                        {formatDate(order.collected_at)}
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}
                            </td>
                            <td className="px-4 py-4">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                                  STATUS_STYLES[order.status] ??
                                  "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {STATUS_LABELS[order.status] ?? order.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 font-['Inter'] text-xs text-on-surface-variant whitespace-nowrap">
                              {formatDate(order.createdAt)}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelected(order)}
                                  title="View details"
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                {!isPaid(order.status) && (
                                  <button
                                    onClick={() => handleMarkPaid(order)}
                                    title="Mark as Paid"
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                )}
                                {isPaid(order.status) &&
                                  ((order._count?.tickets ?? 0) === 0 ? (
                                    <button
                                      onClick={() => handleGenerateTickets(order)}
                                      disabled={ticketActionId === order.id}
                                      title="Generate tickets"
                                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary-container transition-colors disabled:opacity-50"
                                    >
                                      <Ticket className="w-4 h-4" />
                                    </button>
                                  ) : (
                                    <>
                                      <span
                                        title={`${order._count?.tickets} ticket(s) sent`}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-success"
                                      >
                                        <CheckCircle className="w-4 h-4" />
                                      </span>
                                      <button
                                        onClick={() => handleResendTickets(order)}
                                        disabled={ticketActionId === order.id}
                                        title="Resend tickets"
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary-container transition-colors disabled:opacity-50"
                                      >
                                        <Send className="w-4 h-4" />
                                      </button>
                                    </>
                                  ))}
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

      {selected && (
        <OrderModal
          order={selected}
          onClose={() => setSelected(null)}
          onMarkPaid={handleMarkPaid}
          marking={marking}
        />
      )}
    </div>
  );
}
