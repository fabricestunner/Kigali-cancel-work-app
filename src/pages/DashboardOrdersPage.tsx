import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
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
  UsersRound,
} from "lucide-react";
import api from "../services/api";
import type { Order } from "../hooks/useDashboardData";
import {
  OrderModal,
  STATUS_STYLES,
  STATUS_LABELS,
  isPaid,
} from "../components/dashboard/RecentOrdersTable";
import { getAllBuddyGroups, type BuddyGroup } from "../services/buddygroup.service";

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

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100">
      {[...Array(8)].map((_, i) => (
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
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.full_name.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q) ||
        (o.payment_ref ?? "").toLowerCase().includes(q),
    );
  }, [orders, search]);

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
                          <td colSpan={9} className="px-4 py-16 text-center">
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
