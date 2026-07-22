import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  User, Phone, Mail, Package,
  MapPin, ShieldCheck, Lock, Loader2, ArrowRight,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import api from "../services/api";
import type { AxiosError } from "axios";
import type { CheckoutFormData, Order } from "../types";

type InsufficientStock = {
  stockId: number;
  item: string | null;
  requested: number;
  remaining: number;
};

function FormField({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-gray-600 flex items-center gap-1.5">
        <span className="text-gray-400">{icon}</span>{label}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition text-gray-900 placeholder:text-gray-400 text-sm";

export function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, cartTotal, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);

  const cartState = location.state as {
    deliveryOption: "pickup" | "delivery" | "buddy" | null;
    pickupLocation: string;
    deliveryAddress: string;
    buddyGroupId: number | null;
    buddyGroupName: string;
    deliveryFee: number;
    totalAmount: number;
  } | null;

  const [formData, setFormData] = useState<CheckoutFormData>({
    fullName: "",
    phoneNumber: "",
    email: "",
    pickupLocation: cartState?.pickupLocation || "",
    preferredDate: "",
  });

  const total = cartState?.totalAmount || cartTotal;

  const PICKUP_LABELS: Record<string, string> = {
    "bk-arena": "High Land Suit - NYARUTARAMA",
    "kcc": "Car Free Zone",
  };

  const locationLabel =
    cartState?.deliveryOption === "delivery"
      ? cartState.deliveryAddress || "Delivery"
      : cartState?.deliveryOption === "buddy"
        ? `Buddy Team: ${cartState.buddyGroupName || "—"}`
        : PICKUP_LABELS[cartState?.pickupLocation ?? ""] ?? cartState?.pickupLocation ?? "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const order: Order = {
      id: `ORDER-${Date.now()}`,
      orderNumber: `ORD-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
      items: cartItems,
      total,
      formData: {
        ...formData,
        pickupLocation: locationLabel,
        preferredDate: "",
      },
      createdAt: new Date(),
    };

    try {
      const { data } = await api.post("/payment/create", {
        items: cartItems.map((item) => ({
          stockId: item.stockId,
          size: item.size,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: Number(item.product.price),
        })),
        total,
        full_name: formData.fullName,
        email: formData.email,
        phone_number: parseInt(formData.phoneNumber.replace(/\D/g, ""), 10),
        delivery_option: cartState?.deliveryOption || "pickup",
        location: locationLabel,
        buddy_group_id:
          cartState?.deliveryOption === "buddy" ? cartState.buddyGroupId : undefined,
      });

      if (data.paymentUrl) {
        localStorage.setItem("lastOrder", JSON.stringify(order));
        localStorage.setItem("lastOrderRef", data.groupRef);
        clearCart();
        window.location.href = data.paymentUrl;
      } else {
        alert("No payment URL returned");
        setSubmitting(false);
      }
    } catch (error) {
      console.error(error);
      // Oversell guard: backend returns 409 with the items that ran out of stock.
      const response = (error as AxiosError<{ message: string; insufficient?: InsufficientStock[] }>).response;
      if (response?.status === 409 && response.data?.insufficient?.length) {
        const lines = response.data.insufficient
          .map((s) => `• ${s.item ?? `Item #${s.stockId}`} — only ${s.remaining} left (you requested ${s.requested})`)
          .join("\n");
        alert(`Some items are no longer available:\n\n${lines}\n\nPlease update your cart and try again.`);
      } else {
        alert("Something went wrong while processing payment");
      }
      setSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <main className="pt-20 min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 px-6"
        >
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <Package className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">Your cart is empty</h1>
          <p className="text-gray-500">Add items before proceeding to checkout.</p>
          <button onClick={() => navigate("/buy-kit")} className="button-primary">Browse Kits</button>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="pt-20 min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="text-sm text-gray-400 font-medium tracking-widest uppercase mb-1">Secure Checkout</p>
          <h1 className="text-4xl font-extrabold text-gray-900">Complete Your Order</h1>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8 items-start">

          {/* FORM */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSubmit}
            className="lg:col-span-3 space-y-6"
          >
            {/* Personal info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm">1</div>
                <h2 className="text-lg font-bold text-gray-900">Personal Information</h2>
              </div>

              <FormField label="Full Name" icon={<User className="w-3.5 h-3.5" />}>
                <input type="text" placeholder="e.g. John Doe" value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className={inputCls} required />
              </FormField>

              <FormField label="Phone Number" icon={<Phone className="w-3.5 h-3.5" />}>
                <input type="tel" placeholder="e.g. 0780123456" value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className={inputCls} required />
              </FormField>

              <FormField label="Email Address" icon={<Mail className="w-3.5 h-3.5" />}>
                <input type="email" placeholder="e.g. john@email.com" value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={inputCls} required />
              </FormField>
            </div>

            {/* Security line */}
            <div className="flex items-center gap-2 text-xs text-gray-400 px-1">
              <Lock className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Your payment is encrypted and processed securely via DPO Pay.</span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-white text-base transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.99]"
              style={{ background: "linear-gradient(135deg, #5e0081 0%, #c2185b 100%)" }}
            >
              {submitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Processing…</>
              ) : (
                <><ShieldCheck className="w-5 h-5" /> Pay RWF {total.toLocaleString()} <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </motion.form>

          {/* ORDER SUMMARY */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-4 sticky top-28"
          >
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50">
                <h2 className="font-bold text-gray-900">Order Summary</h2>
              </div>

              <div className="p-6 space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                      <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.product.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded-full">
                          Size {item.size}
                        </span>
                        <span className="text-xs text-gray-400">× {item.quantity}</span>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-gray-900 flex-shrink-0">
                      RWF {(Number(item.product.price) * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}

                {cartState && locationLabel && (
                  <div className="pt-3 border-t border-gray-50 space-y-2">
                    <div className="flex items-start gap-2 text-xs text-gray-500">
                      <MapPin className="w-3.5 h-3.5 text-purple-500 flex-shrink-0 mt-0.5" />
                      <span>{locationLabel}</span>
                    </div>
                    {cartState.deliveryOption === "delivery" && cartState.deliveryFee > 0 && (
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Delivery fee</span>
                        <span className="font-medium">RWF {cartState.deliveryFee.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-sm text-gray-500 font-medium">Total</span>
                  <span className="text-2xl font-extrabold text-purple-700">
                    RWF {total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Trust badge */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">Secure &amp; Trusted</p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  Payments processed by DPO Pay. Your data is SSL-encrypted.
                </p>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </main>
  );
}
