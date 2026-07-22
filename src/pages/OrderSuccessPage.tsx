import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import {
  CheckCircle2, Package, Mail, MapPin, Calendar,
  Download, ShoppingBag, Home,
} from "lucide-react";
import type { Order } from "../types";
import api from "../services/api";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};
const stagger = {
  show: { transition: { staggerChildren: 0.08 } },
};

const LOCATION_LABELS: Record<string, string> = {
  "bk-arena": "High Land Suit – Nyarutarama",
  kcc: "Car Free Zone",
};

export function OrderSuccessPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [searchParams] = useSearchParams();

  const transactionToken = searchParams.get("TransactionToken");

  useEffect(() => {
    const saved = localStorage.getItem("lastOrder");
    if (saved) {
      try {
        setOrder(JSON.parse(saved) as Order);
      } catch {
        // corrupted data — ignore
      }
    }
  }, []);

  // Verify payment with backend as soon as DPO redirects back with the token.
  // Backend resolves CompanyRef from DPO's own response, so TransactionToken alone
  // is enough — localStorage ref is an optional hint only.
  useEffect(() => {
    if (!transactionToken) return;
    const companyRef = localStorage.getItem("lastOrderRef");
    api
      .post("/payment/callback", {
        TransactionToken: transactionToken,
        ...(companyRef ? { CompanyRef: companyRef } : {}),
      })
      .then(() => localStorage.removeItem("lastOrderRef"))
      .catch((err) =>
        console.error("[order-success] callback failed:", err?.response?.data ?? err.message)
      );
  }, [transactionToken]);

  const orderRef = transactionToken ?? order?.orderNumber ?? "—";
  const locationLabel =
    LOCATION_LABELS[order?.formData.pickupLocation ?? ""] ??
    order?.formData.pickupLocation ??
    null;

  const handleDownload = () => {
    if (!order) return;
    const lines = [
      "KIGALI CANCER WALK – ORDER SUMMARY",
      "=".repeat(40),
      `Reference : ${orderRef}`,
      `Date      : ${new Date(order.createdAt).toLocaleDateString()}`,
      "",
      "CUSTOMER",
      `Name  : ${order.formData.fullName}`,
      `Email : ${order.formData.email}`,
      `Phone : ${order.formData.phoneNumber}`,
      "",
      "ITEMS",
      ...order.items.map(
        (i) =>
          `  ${i.product.name} | Size ${i.size} × ${i.quantity}  →  RWF ${(Number(i.product.price) * i.quantity).toLocaleString()}`
      ),
      "",
      `TOTAL  RWF ${order.total.toLocaleString()}`,
      "",
      ...(locationLabel ? [`COLLECTION : ${locationLabel}`] : []),
      ...(order.formData.preferredDate
        ? [`DATE       : ${order.formData.preferredDate}`]
        : []),
      "",
      "Please bring a valid ID to collect your kit.",
      "Thank you for supporting the Kigali Cancer Walk!",
    ].join("\n");

    const a = document.createElement("a");
    a.href = "data:text/plain;charset=utf-8," + encodeURIComponent(lines);
    a.download = `kcw-order-${orderRef}.txt`;
    a.click();
  };

  return (
    <main className="min-h-screen bg-gray-50 pt-20">

      {/* ── Hero banner ─────────────────────────────────────── */}
      <div
        className="w-full py-16"
        style={{ background: "linear-gradient(135deg, #5e0081 0%, #c2185b 100%)" }}
      >
        <div className="max-w-2xl mx-auto px-6 text-center">

          {/* Animated checkmark */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 130, damping: 10, delay: 0.1 }}
            className="relative inline-flex mb-6"
          >
            <span className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
            <span className="absolute inset-3 rounded-full bg-white/15 animate-ping [animation-delay:200ms]" />
            <div className="relative w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight"
          >
            Payment Successful!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-3 text-lg text-white/80 font-medium"
          >
            {order
              ? `Thank you, ${order.formData.fullName}! Your order is confirmed.`
              : "Your order has been confirmed."}
          </motion.p>

          {order?.formData.email && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white/90 text-sm font-medium px-4 py-2 rounded-full"
            >
              <Mail className="w-4 h-4 flex-shrink-0" />
              Confirmation sent to {order.formData.email}
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Page content ────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-4">

        {/* Order reference */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 flex items-center justify-between gap-4"
        >
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Order Reference
            </p>
            <p className="mt-1 text-base font-bold text-gray-900 font-mono break-all">
              {orderRef}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
            <Package className="w-6 h-6 text-purple-600" />
          </div>
        </motion.div>

        {order && (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            transition={{ delayChildren: 0.55 }}
            className="space-y-4"
          >
            {/* Items */}
            <motion.div
              variants={fadeUp}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-50">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  Order Items
                </p>
              </div>

              <div className="divide-y divide-gray-50">
                {order.items.map((cartItem) => (
                  <div key={cartItem.id} className="flex items-center gap-4 px-6 py-4">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      <img
                        src={cartItem.product.imageUrl}
                        alt={cartItem.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {cartItem.product.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded-full">
                          Size {cartItem.size}
                        </span>
                        <span className="text-xs text-gray-400">× {cartItem.quantity}</span>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-gray-900 flex-shrink-0">
                      RWF {(Number(cartItem.product.price) * cartItem.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="px-6 py-4 bg-gray-50 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Total Paid</span>
                <span className="text-2xl font-extrabold text-purple-700">
                  RWF {order.total.toLocaleString()}
                </span>
              </div>
            </motion.div>

            {/* Collection details */}
            {(locationLabel || order.formData.preferredDate) && (
              <motion.div
                variants={fadeUp}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 space-y-4"
              >
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  Collection Details
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {locationLabel && (
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium">Location</p>
                        <p className="text-sm font-semibold text-gray-900 mt-0.5">
                          {locationLabel}
                        </p>
                      </div>
                    </div>
                  )}
                  {order.formData.preferredDate && (
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium">Preferred Date</p>
                        <p className="text-sm font-semibold text-gray-900 mt-0.5">
                          {order.formData.preferredDate}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Pickup notice */}
            <motion.div
              variants={fadeUp}
              className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4"
            >
              <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold leading-none">!</span>
              </div>
              <p className="text-sm text-amber-900 leading-relaxed">
                Please bring a <strong>valid ID</strong> and your order reference
                when collecting your kit.
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: order ? 1.0 : 0.6 }}
          className="flex flex-col sm:flex-row gap-3 pt-2"
        >
          {order && (
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl border-2 border-gray-200 text-gray-700 font-semibold text-sm hover:border-purple-300 hover:text-purple-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Summary
            </button>
          )}
          <Link
            to="/buy-kit"
            className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl border-2 border-gray-200 text-gray-700 font-semibold text-sm hover:border-purple-300 hover:text-purple-700 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            Buy Another Kit
          </Link>
          <Link
            to="/"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-white text-sm transition-all active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #5e0081 0%, #c2185b 100%)" }}
          >
            <Home className="w-4 h-4" />
            Return Home
          </Link>
        </motion.div>

      </div>
    </main>
  );
}
