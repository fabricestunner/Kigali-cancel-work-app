import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import type { AxiosError } from "axios";
import {
  Heart,
  Mail,
  Home,
  RefreshCw,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import api from "../services/api";
import type { ApiErrorResponse } from "../types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DonationRecord {
  fullName: string;
  email: string;
  amount: number;
  currency: "USD" | "RWF";
  quantity: number;
  total: number;
  label: string;
}

// ── Reusable sub-components ───────────────────────────────────────────────────

function HeroBanner({
  donorName,
  email,
}: {
  donorName: string | null;
  email: string | null;
}) {
  return (
    <div
      className="w-full py-16"
      style={{
        background: "linear-gradient(135deg, #5e0081 0%, #c2185b 100%)",
      }}
    >
      <div className="max-w-2xl mx-auto px-6 text-center">
        {/* Pulsing heart */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 130,
            damping: 10,
            delay: 0.1,
          }}
          className="relative inline-flex mb-6"
        >
          <span className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
          <span className="absolute inset-3 rounded-full bg-white/15 animate-ping [animation-delay:200ms]" />
          <div className="relative w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
            <Heart className="w-10 h-10 text-white fill-white" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight"
        >
          Thank You{donorName ? `, ${donorName}` : ""}!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-4 text-base sm:text-lg text-white/85 leading-relaxed max-w-xl mx-auto"
        >
          We Thank you for your contribution . Together We Can save Lives .
        </motion.p>

        {email && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-5 inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white/90 text-sm font-medium px-4 py-2 rounded-full"
          >
            <Mail className="w-4 h-4 flex-shrink-0" />A confirmation email has
            been sent to your inbox.
          </motion.div>
        )}
      </div>
    </div>
  );
}

function DonationSummaryCard({ record }: { record: DonationRecord }) {
  const fmt = (n: number, currency: "USD" | "RWF") =>
    currency === "USD" ? `$${n.toLocaleString()}` : `RWF ${n.toLocaleString()}`;

  const rows: { label: string; value: string }[] = [
    { label: "Donor Name", value: record.fullName },
    { label: "Donation Amount", value: fmt(record.amount, record.currency) },
    {
      label: "Vouchers",
      value: `${record.quantity} × ${record.label}`,
    },
    { label: "Total Paid", value: fmt(record.total, record.currency) },
    {
      label: "Date",
      value: new Date().toLocaleDateString("en-RW", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-gray-50">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          📋 Donation Summary
        </p>
      </div>
      <div className="divide-y divide-gray-50">
        {rows.map(({ label, value }) => (
          <div
            key={label}
            className="flex items-center justify-between px-6 py-3.5 gap-4"
          >
            <span className="text-sm text-gray-400 flex-shrink-0">{label}</span>
            <span className="text-sm font-semibold text-gray-800 text-right">
              {value}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function ImpactMessage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.65 }}
      className="bg-purple-50 border border-purple-100 rounded-2xl px-6 py-5 space-y-2"
    >
      <p className="text-sm font-bold text-purple-800">Your Impact</p>
      <p className="text-sm text-purple-700 leading-relaxed">
        Every Donation helps is a step closer to release our mission to acquire
        Rwanda's first ever <strong>SPECT SCAN Machine</strong> to be housed at
        Kanombe Military Hospital. This special Scan machine will help to
        diagonise Cancer and other diseases and save many lives. Together we can
        kick cancer out of Rwanda .
      </p>
    </motion.div>
  );
}

function ActionButtons({ showDonateAgain }: { showDonateAgain: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="flex flex-col sm:flex-row gap-3 pt-2"
    >
      {showDonateAgain && (
        <>
          <Link
            to="/donate"
            className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl border-2 border-gray-200 text-gray-700 font-semibold text-sm hover:border-purple-300 hover:text-purple-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Donate Again
          </Link>

          <Link
            to="/buy-kit"
            className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl border-2 border-pink-200 text-pink-700 font-semibold text-sm hover:bg-pink-50 transition-colors"
          >
            <Heart className="w-4 h-4" />
            Buy a Kit
          </Link>
        </>
      )}

      <Link
        to="/"
        className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-white text-sm transition-all active:scale-[0.98]"
        style={{
          background: "linear-gradient(135deg, #5e0081 0%, #c2185b 100%)",
        }}
      >
        <Home className="w-4 h-4" />
        Return Home
      </Link>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type VerifyStatus = "idle" | "verifying" | "verified" | "failed";

export function DonationSuccessPage() {
  // Hydrate the last donation from localStorage during initial state creation
  const [donation] = useState<DonationRecord | null>(() => {
    const saved = localStorage.getItem("lastDonation");
    if (!saved) return null;
    try {
      return JSON.parse(saved) as DonationRecord;
    } catch {
      // corrupted — ignore
      return null;
    }
  });
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>("idle");
  const [searchParams] = useSearchParams();

  const transactionToken = searchParams.get("TransactionToken");

  const verifyPayment = async () => {
    if (!transactionToken) return;
    setVerifyStatus("verifying");
    try {
      // Backend resolves CompanyRef from DPO's own response, so we only need
      // TransactionToken. Pass CompanyRef as a hint if localStorage has it
      // (e.g. same-origin flow), but don't block on it.
      const companyRef = localStorage.getItem("lastDonationRef");
      await api.post("/donation/callback", {
        TransactionToken: transactionToken,
        ...(companyRef ? { CompanyRef: companyRef } : {}),
      });
      localStorage.removeItem("lastDonationRef");
      setVerifyStatus("verified");
    } catch (err) {
      const error = err as AxiosError<ApiErrorResponse>;
      console.error(
        "[donation-success] callback failed:",
        error.response?.data ?? error.message,
      );
      setVerifyStatus("failed");
    }
  };

  // Auto-verify as soon as DPO redirects back with the token
  useEffect(() => {
    if (transactionToken) verifyPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionToken]);

  return (
    <main className="min-h-screen bg-gray-50 pt-20">
      <HeroBanner
        donorName={donation?.fullName ?? null}
        email={donation?.email ?? null}
      />

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-4">
        {/* Transaction reference + verification status */}
        {transactionToken && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 space-y-4"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                  Transaction Reference
                </p>
                <p className="mt-1 text-sm font-bold text-gray-900 font-mono break-all">
                  {transactionToken}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center flex-shrink-0">
                <Heart className="w-6 h-6 text-pink-500 fill-pink-200" />
              </div>
            </div>

            {/* Verification status bar */}
            {verifyStatus === "verifying" && (
              <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-2.5">
                <Loader2 className="w-4 h-4 animate-spin text-purple-500 flex-shrink-0" />
                Confirming your payment with our server…
              </div>
            )}
            {verifyStatus === "verified" && (
              <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-xl px-4 py-2.5">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                Payment confirmed — your record has been updated.
              </div>
            )}
            {verifyStatus === "failed" && (
              <div className="flex items-center justify-between gap-3 bg-amber-50 rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-2 text-sm text-amber-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  Could not confirm automatically. Your payment is safe — click
                  to retry.
                </div>
                <button
                  onClick={verifyPayment}
                  className="flex-shrink-0 text-xs font-bold text-amber-700 underline hover:text-amber-900"
                >
                  Retry
                </button>
              </div>
            )}
          </motion.div>
        )}

        {donation && <DonationSummaryCard record={donation} />}

        <ImpactMessage />

        <ActionButtons showDonateAgain={!!donation} />
      </div>
    </main>
  );
}
