import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AxiosError } from "axios";
import type { ApiErrorResponse } from "../types";
import {
  Shield,
  CheckCircle,
  X,
  Lock,
  Eye,
  Heart,
  Loader2,
  ArrowRight,
  ShieldCheck,
  User,
  Mail,
  Phone,
} from "lucide-react";
import { createDonation } from "../services/donation.service";
import { HandHeart } from "lucide-react";

interface DonationAmount {
  amount: number;
  label: string;
  currency: "USD" | "RWF";
}

const usdAmounts: DonationAmount[] = [
  { amount: 5, label: "$5", currency: "USD" },
  { amount: 10, label: "$10", currency: "USD" },
  { amount: 20, label: "$20", currency: "USD" },
  { amount: 50, label: "$50", currency: "USD" },
  { amount: 100, label: "$100", currency: "USD" },
];

const rwfAmounts: DonationAmount[] = [
  // { amount: 5, label: "RWF 5", currency: "RWF" },
  { amount: 10000, label: "RWF 10,000", currency: "RWF" },
  { amount: 50000, label: "RWF 50,000", currency: "RWF" },
  { amount: 100000, label: "RWF 100,000", currency: "RWF" },
  { amount: 250000, label: "RWF 250,000", currency: "RWF" },
  { amount: 500000, label: "RWF 500,000", currency: "RWF" },
];

const inputCls =
  "w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none transition text-gray-900 placeholder:text-gray-400 text-sm";

export function DonationPage() {
  const [selected, setSelected] = useState<DonationAmount | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  const FEE_RATE = 0.07;

  const total = selected ? selected.amount * quantity : 0;
  const totalWithFee = selected
    ? selected.currency === "RWF"
      ? Math.ceil(total * (1 + FEE_RATE))
      : Math.round(total * (1 + FEE_RATE) * 100) / 100
    : 0;
  const fee = totalWithFee - total;

  const fmt = (amount: number, currency: "USD" | "RWF") =>
    currency === "USD"
      ? `$${amount.toLocaleString()}`
      : `RWF ${amount.toLocaleString()}`;

  const totalLabel = selected ? fmt(total, selected.currency) : "";
  const feeLabel = selected ? fmt(fee, selected.currency) : "";
  const totalWithFeeLabel = selected
    ? fmt(totalWithFee, selected.currency)
    : "";

  const openModal = (item: DonationAmount) => {
    setSelected(item);
    setQuantity(1);
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (!isSubmitting) setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const { paymentUrl, paymentRef } = await createDonation({
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        amount: selected.amount,
        currency: selected.currency,
        quantity,
      });

      // Save for success page
      localStorage.setItem(
        "lastDonation",
        JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          amount: selected.amount,
          currency: selected.currency,
          quantity,
          total,
          label: selected.label,
        }),
      );
      localStorage.setItem("lastDonationRef", paymentRef);

      window.location.href = paymentUrl;
    } catch (err) {
      const error = err as AxiosError<ApiErrorResponse>;
      const msg =
        error.response?.data?.explanation ||
        error.response?.data?.message ||
        "Something went wrong. Please try again.";
      setError(msg);
      setIsSubmitting(false);
    }
  };

  const scrollToDonation = () =>
    document
      .getElementById("donation-section")
      ?.scrollIntoView({ behavior: "smooth" });

  /* ── Column renderer ────────────────────────────────────── */
  const renderColumn = (
    items: DonationAmount[],
    title: string,
    accent: string,
  ) => (
    <div className="space-y-4">
      <div className={`text-center mb-6`}>
        <span
          className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold text-white ${accent}`}
        >
          {title}
        </span>
      </div>
      <div className="space-y-3">
        {items.map((item, i) => {
          const isSelected =
            selected?.amount === item.amount &&
            selected?.currency === item.currency;
          return (
            <motion.div
              key={`${item.currency}-${item.amount}`}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className={`relative p-4 rounded-2xl border-2 transition-all duration-200 bg-white ${
                isSelected
                  ? "border-purple-500 shadow-lg shadow-purple-100"
                  : "border-gray-100 hover:border-purple-200 hover:shadow-md"
              }`}
            >
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 bg-purple-600 text-white rounded-full p-1"
                >
                  <CheckCircle className="w-4 h-4" />
                </motion.div>
              )}

              <div className="flex items-center justify-between gap-3">
                {/* Amount */}
                <div>
                  <p className="text-xl font-extrabold text-gray-900">
                    {item.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">per voucher</p>
                </div>

                {/* Qty + Donate */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden text-sm">
                    <button
                      type="button"
                      onClick={() => {
                        if (isSelected) setQuantity((q) => Math.max(1, q - 1));
                      }}
                      className="px-3 py-2 hover:bg-gray-100 transition text-gray-600 font-bold"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-semibold text-gray-800">
                      {isSelected ? quantity : 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (isSelected) setQuantity((q) => q + 1);
                      }}
                      className="px-3 py-2 hover:bg-gray-100 transition text-gray-600 font-bold"
                    >
                      +
                    </button>
                  </div>

                  <motion.button
                    type="button"
                    onClick={() => openModal(item)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 rounded-xl text-white text-sm font-bold transition-all"
                    style={{
                      background: "linear-gradient(135deg,#5e0081,#c2185b)",
                    }}
                  >
                    Donate
                  </motion.button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative min-h-[580px] flex items-center overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg,#3a0055 0%,#5e0081 40%,#c2185b 100%)",
          }}
        />
        <div className="absolute inset-0 bg-black/30" />

        {/* decorative blobs */}
        <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-white/5 blur-3xl" />

        <div className="relative z-10 px-6 max-w-5xl mx-auto pt-24 pb-16 w-full text-center text-white">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm mb-6 border border-white/20"
          >
            <Heart className="w-4 h-4 text-pink-300" />
            <span className="text-sm font-semibold">
              Make a Difference Today
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight"
          >
            Support Our Mission
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-white/85 mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            Our mission is to mobilise{" "}
            <strong className="text-pink-300">$5 million USD</strong> to acquire
            a Rwanda SPECT Scanner that will help in diagnosis, detection and
            follow up checks in order to sustain lives. Every voucher you buy
            brings us closer.
          </motion.p>

          <motion.button
            onClick={scrollToDonation}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 bg-white text-purple-700 font-bold px-8 py-4 rounded-full shadow-xl hover:shadow-2xl transition-all"
          >
            <Heart className="w-5 h-5 text-pink-500" />
            Donate Now
            <ArrowRight className="w-4 h-4" />
          </motion.button>
          <motion.a
            href="https://fund-spect-scan-campaign.vercel.app/donate"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white font-bold px-8 py-4 rounded-full border-2 border-white/40 hover:bg-white/20 transition-all"
          >
            <HandHeart className="w-5 h-5 text-pink-300" />
            Commit as Donor
          </motion.a>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-6 mt-12"
          >
            {[
              { icon: <Lock className="w-4 h-4" />, label: "Secure Payments" },
              { icon: <Eye className="w-4 h-4" />, label: "Transparent Usage" },
              {
                icon: <Shield className="w-4 h-4" />,
                label: "Verified Organization",
              },
            ].map((b) => (
              <div
                key={b.label}
                className="flex items-center gap-2 text-white/70 text-sm"
              >
                {b.icon}
                <span>{b.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Donation Packages ─────────────────────────────── */}
      <section id="donation-section" className="py-20 px-6 max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-extrabold text-gray-900 mb-3">
            Join The Movement
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Buy one or more vouchers. Every amount counts toward the SPECT Scan
            Machine.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {renderColumn(usdAmounts, "USD Vouchers", "bg-blue-600")}
          {renderColumn(rwfAmounts, "RWF Vouchers", "bg-purple-700")}
        </div>
      </section>

      {/* ── Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && selected && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            <motion.div
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close */}
              <button
                onClick={closeModal}
                disabled={isSubmitting}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition disabled:opacity-40"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>

              {/* Header */}
              <div className="mb-6">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{
                    background: "linear-gradient(135deg,#5e0081,#c2185b)",
                  }}
                >
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-extrabold text-gray-900 mb-1">
                  Complete Your Donation
                </h3>
                <p className="text-sm text-gray-500">
                  Fill in your details to proceed to secure payment.
                </p>
              </div>

              {/* Summary */}
              <div className="bg-purple-50 border border-purple-100 rounded-2xl px-4 py-3 mb-6 space-y-2">
                {/* Qty control */}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500 font-medium">Vouchers</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 font-bold hover:bg-gray-50 text-sm"
                    >
                      −
                    </button>
                    <span className="font-bold text-gray-800 w-6 text-center">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 font-bold hover:bg-gray-50 text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>

                <hr className="border-purple-100" />

                {/* Fee breakdown */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Donation amount</span>
                    <span className="font-semibold text-gray-800">
                      {totalLabel}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Transaction fee </span>
                    <span className="font-semibold text-gray-800">
                      {feeLabel}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pt-1 border-t border-purple-200">
                    <span className="font-bold text-gray-700">
                      Total to pay
                    </span>
                    <span className="text-lg font-extrabold text-purple-700">
                      {totalWithFeeLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-600 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-gray-400" /> Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Your full name"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className={inputCls}
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-600 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-gray-400" /> Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className={inputCls}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-600 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400" /> Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0780 000 000"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className={inputCls}
                  />
                </div>

                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isSubmitting}
                    className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition disabled:opacity-40"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 rounded-xl text-white font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{
                      background: "linear-gradient(135deg,#5e0081,#c2185b)",
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Processing…
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" /> Pay{" "}
                        {totalWithFeeLabel}
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3" /> Secured by DPO Pay — SSL
                  encrypted
                </p>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
