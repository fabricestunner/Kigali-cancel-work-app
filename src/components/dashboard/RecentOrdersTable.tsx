import { useState } from "react";
import { Eye, CheckCircle, X, Loader2 } from "lucide-react";
import api from "../../services/api";
import type { Order } from "../../hooks/useDashboardData";

interface RecentOrdersTableProps {
  orders: Order[];
  loading?: boolean;
  onRefresh?: () => void;
}

export const STATUS_STYLES: Record<string, string> = {
  paid: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  failed: "bg-red-100 text-red-700",
  paid_backorder: "bg-amber-100 text-amber-700",
};

// Human-readable labels for statuses that aren't a single word.
export const STATUS_LABELS: Record<string, string> = {
  paid_backorder: "Paid · Backorder",
};

// An order is fully paid (no further payment action needed) when its status
// starts with "paid" — covers both "paid" and "paid_backorder".
export const isPaid = (status: string) => status.startsWith("paid");

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-RW", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function formatAmount(amount: string | number, currency: string) {
  const num = typeof amount === "number" ? amount : Number(amount);
  return `${currency} ${num.toLocaleString("en-US")}`;
}

// ── Detail Modal ──────────────────────────────────────────────────────────────

interface OrderModalProps {
  order: Order;
  onClose: () => void;
  onMarkPaid: (order: Order) => Promise<void>;
  marking: boolean;
}

export function OrderModal({ order, onClose, onMarkPaid, marking }: OrderModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-5 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg, #5e0081 0%, #c2185b 100%)" }}
        >
          <div>
            <p className="text-xs font-semibold text-white/70 uppercase tracking-widest">
              Order Details
            </p>
            <p className="text-white font-bold text-sm font-mono mt-0.5 break-all">
              {order.payment_ref ?? `#${order.id}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Status</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                STATUS_STYLES[order.status] ?? "bg-gray-100 text-gray-600"
              }`}
            >
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
          </div>

          <hr className="border-gray-100" />

          {/* Customer */}
          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Customer
            </p>
            <Row label="Name" value={order.full_name} />
            <Row label="Email" value={order.email} />
            <Row label="Phone" value={String(order.phone_number)} />
          </div>

          <hr className="border-gray-100" />

          {/* Order */}
          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Order
            </p>
            <Row label="Item / Size" value={order.stock?.item ?? "—"} />
            <Row label="Quantity" value={String(order.quantity)} />
            <Row
              label="Amount"
              value={formatAmount(order.amount_paid, order.currency)}
              bold
            />
            <Row
              label="Collection"
              value={
                order.delivery_option === "delivery"
                  ? `Delivery → ${order.location}`
                  : order.delivery_option === "buddy"
                    ? order.location
                    : `Pickup at ${order.location}`
              }
            />
            {order.buddy_group && (
              <Row
                label="Buddy Group Leader"
                value={`${order.buddy_group.leader_name} (${order.buddy_group.leader_email})`}
              />
            )}
            <Row label="Date" value={formatDate(order.createdAt)} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
          {!isPaid(order.status) && (
            <button
              onClick={() => onMarkPaid(order)}
              disabled={marking}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-60 transition-colors"
            >
              {marking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Mark as Paid
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-gray-400 flex-shrink-0">{label}</span>
      <span
        className={`text-sm text-right ${
          bold ? "font-bold text-purple-700" : "font-medium text-gray-800"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

// ── Main Table ────────────────────────────────────────────────────────────────

export function RecentOrdersTable({
  orders,
  loading,
  onRefresh,
}: RecentOrdersTableProps) {
  const [selected, setSelected] = useState<Order | null>(null);
  const [marking, setMarking] = useState(false);
  // optimistic local status overrides: orderId → status
  const [localStatus, setLocalStatus] = useState<Record<number, string>>({});

  const handleMarkPaid = async (order: Order) => {
    setMarking(true);
    try {
      await api.patch(`/payment/orders/${order.id}/status`, { status: "paid" });
      setLocalStatus((prev) => ({ ...prev, [order.id]: "paid" }));
      setSelected((prev) => (prev ? { ...prev, status: "paid" } : null));
      onRefresh?.();
    } catch {
      alert("Failed to update order status. Please try again.");
    } finally {
      setMarking(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant animate-pulse">
        <div className="flex justify-between mb-6">
          <div>
            <div className="h-5 bg-gray-100 rounded w-40 mb-2" />
            <div className="h-4 bg-gray-100 rounded w-32" />
          </div>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 py-3 border-b border-outline-variant">
            {[...Array(6)].map((_, j) => (
              <div key={j} className="h-4 bg-gray-100 rounded flex-1" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  const recent = orders.slice(0, 10);

  return (
    <>
      {selected && (
        <OrderModal
          order={{ ...selected, status: localStatus[selected.id] ?? selected.status }}
          onClose={() => setSelected(null)}
          onMarkPaid={handleMarkPaid}
          marking={marking}
        />
      )}

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-on-surface">
              Recent Kit Orders
            </h3>
            <p className="font-['Inter'] text-sm text-on-surface-variant">
              {orders.length} total order{orders.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {recent.length === 0 ? (
          <p className="text-center text-on-surface-variant py-8 text-sm">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant">
                  {["Ref", "Participant", "Item", "Qty", "Amount", "Status", "Date", ""].map(
                    (h) => (
                      <th
                        key={h}
                        className={`font-['Inter'] text-xs font-semibold text-on-surface-variant py-3 uppercase tracking-wide ${
                          h === "" ? "w-24" : h === "Qty" || h === "Amount" ? "text-right" : "text-left"
                        }`}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {recent.map((order) => {
                  const status = localStatus[order.id] ?? order.status;
                  return (
                    <tr
                      key={order.id}
                      className="border-b border-outline-variant hover:bg-surface-container-low transition-colors"
                    >
                      <td className="font-['Inter'] text-xs font-medium text-primary py-3 max-w-[100px] truncate">
                        {order.payment_ref ?? `#${order.id}`}
                      </td>
                      <td className="font-['Inter'] text-sm text-on-surface py-3">
                        {order.full_name}
                      </td>
                      <td className="font-['Inter'] text-sm text-on-surface-variant py-3 max-w-[80px] truncate">
                        {order.stock?.item ?? "—"}
                      </td>
                      <td className="font-['Inter'] text-sm text-on-surface text-right py-3">
                        {order.quantity}
                      </td>
                      <td className="font-['Inter'] text-sm text-on-surface text-right py-3 whitespace-nowrap">
                        {formatAmount(order.amount_paid, order.currency)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                            STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {STATUS_LABELS[status] ?? status}
                        </span>
                      </td>
                      <td className="font-['Inter'] text-xs text-on-surface-variant py-3 whitespace-nowrap">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelected(order)}
                            title="View details"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {!isPaid(status) && (
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
