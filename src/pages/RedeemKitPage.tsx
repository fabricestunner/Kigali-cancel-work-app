import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gift,
  Ticket,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Download,
  Mail,
} from "lucide-react";
import type { AxiosError } from "axios";
import {
  verifyFreeKitToken,
  redeemFreeKitToken,
  PICKUP_LOCATIONS,
  type FreeKitRedeemResponse,
} from "../services/freekit.service";
import { getStock, type Stock } from "../services/stock.service";

type Step = "token" | "details" | "done";

function errorMessage(error: unknown, fallback: string): string {
  const response = (error as AxiosError<{ message?: string }>).response;
  return response?.data?.message ?? fallback;
}

export function RedeemKitPage() {
  const [step, setStep] = useState<Step>("token");
  const [token, setToken] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [stockId, setStockId] = useState<number | null>(null);
  const [pickupLocation, setPickupLocation] = useState("");
  const [result, setResult] = useState<FreeKitRedeemResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (step !== "details" || stocks.length > 0) return;
    getStock()
      .then(setStocks)
      .catch(() => setStocks([]));
  }, [step, stocks.length]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await verifyFreeKitToken(token);
      setBuyerName(res.buyer_name);
      setToken(res.token);
      setStep("details");
    } catch (err) {
      setError(errorMessage(err, "Could not verify the token. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockId || !pickupLocation) return;
    setLoading(true);
    setError(null);
    try {
      const res = await redeemFreeKitToken({
        token,
        stock_id: stockId,
        pickup_location: pickupLocation,
      });
      setResult(res);
      setStep("done");
    } catch (err) {
      setError(errorMessage(err, "Redemption failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface font-['Inter'] text-[15px] text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary transition";

  return (
    <main className="pt-20">
      <section className="py-stack-lg px-gutter max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 90 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-['Inter'] text-[13px] tracking-[0.05em] font-semibold">
              <Gift className="w-4 h-4" />
              <span>Buy 4, Get 1 Free</span>
            </div>
            <h1 className="font-['Plus_Jakarta_Sans'] text-[40px] leading-[1.1] tracking-[-0.02em] font-extrabold text-on-surface">
              Redeem Your Free Kit
            </h1>
            <p className="font-['Inter'] text-[16px] text-on-surface-variant leading-relaxed">
              Bought 4 or more kits? Enter the claim token from your order
              confirmation email to collect your free kit — no payment needed.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {/* STEP 1: token */}
            {step === "token" && (
              <motion.form
                key="token"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                onSubmit={handleVerify}
                className="bg-surface-container-low border border-outline-variant rounded-3xl p-8 space-y-6"
              >
                <div className="space-y-1.5">
                  <label className="font-['Inter'] text-[14px] font-semibold text-on-surface">
                    Claim Token <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <Ticket className="w-4 h-4 text-on-surface-variant absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={token}
                      onChange={(e) => setToken(e.target.value.toUpperCase())}
                      placeholder="KCW-XXXXXXXX"
                      className={`${inputCls} pl-11 font-mono tracking-widest uppercase`}
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-['Inter'] text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 gradient-primary text-white py-4 rounded-full font-['Inter'] text-[15px] font-semibold tracking-[0.03em] hover:opacity-90 active:scale-[0.98] transition duration-200 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Verifying…
                    </>
                  ) : (
                    <>
                      Verify Token <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.form>
            )}

            {/* STEP 2: size + pickup */}
            {step === "details" && (
              <motion.form
                key="details"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                onSubmit={handleRedeem}
                className="bg-surface-container-low border border-outline-variant rounded-3xl p-8 space-y-6"
              >
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-['Inter'] text-sm">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  Token verified — welcome back, <strong>{buyerName}</strong>!
                </div>

                {/* Size */}
                <div className="space-y-1.5">
                  <label className="font-['Inter'] text-[14px] font-semibold text-on-surface">
                    Free Kit Size <span className="text-error">*</span>
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {stocks.map((s) => {
                      const out = s.remaining < 1;
                      return (
                        <label
                          key={s.id}
                          className={`flex flex-col items-center justify-center px-3 py-3 rounded-xl border font-['Inter'] text-[14px] font-medium transition ${
                            out
                              ? "border-outline-variant bg-surface-container text-on-surface-variant/40 cursor-not-allowed"
                              : stockId === s.id
                                ? "border-primary bg-primary/10 text-primary ring-1 ring-primary cursor-pointer"
                                : "border-outline-variant bg-surface text-on-surface hover:border-primary/50 cursor-pointer"
                          }`}
                        >
                          <input
                            type="radio"
                            name="size"
                            required
                            disabled={out}
                            checked={stockId === s.id}
                            onChange={() => setStockId(s.id)}
                            className="sr-only"
                          />
                          <span>{s.item}</span>
                          {out && <span className="text-[10px]">Out of stock</span>}
                        </label>
                      );
                    })}
                    {stocks.length === 0 && (
                      <p className="col-span-full font-['Inter'] text-sm text-on-surface-variant py-2">
                        Loading sizes…
                      </p>
                    )}
                  </div>
                </div>

                {/* Pickup location */}
                <div className="space-y-1.5">
                  <label className="font-['Inter'] text-[14px] font-semibold text-on-surface">
                    Pickup Location <span className="text-error">*</span>
                  </label>
                  <div className="space-y-2">
                    {PICKUP_LOCATIONS.map((loc) => (
                      <label
                        key={loc}
                        className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                          pickupLocation === loc
                            ? "border-primary bg-primary/5"
                            : "border-outline-variant hover:border-primary/50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="pickup"
                          required
                          checked={pickupLocation === loc}
                          onChange={() => setPickupLocation(loc)}
                          className="sr-only"
                        />
                        <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="font-['Inter'] text-[15px] font-semibold text-on-surface">
                          {loc}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-['Inter'] text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !stockId || !pickupLocation}
                  className="w-full flex items-center justify-center gap-2 gradient-primary text-white py-4 rounded-full font-['Inter'] text-[15px] font-semibold tracking-[0.03em] hover:opacity-90 active:scale-[0.98] transition duration-200 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Redeeming…
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4" /> Claim My Free Kit
                    </>
                  )}
                </button>
              </motion.form>
            )}

            {/* STEP 3: QR code */}
            {step === "done" && result && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-surface-container-low border border-outline-variant rounded-3xl p-8 space-y-6 text-center"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 120 }}
                >
                  <CheckCircle2 className="w-16 h-16 text-primary mx-auto" />
                </motion.div>
                <div className="space-y-2">
                  <h2 className="font-['Plus_Jakarta_Sans'] text-[28px] font-extrabold text-on-surface">
                    Free Kit Confirmed!
                  </h2>
                  <p className="font-['Inter'] text-[15px] text-on-surface-variant">
                    Show this QR code at the pickup point to collect your kit.
                  </p>
                </div>

                <img
                  src={result.qr}
                  alt="Free kit QR code"
                  className="w-56 h-56 mx-auto rounded-2xl border border-outline-variant bg-white"
                />

                <div className="bg-surface rounded-2xl border border-outline-variant p-4 space-y-2 text-left">
                  <div className="flex justify-between font-['Inter'] text-sm">
                    <span className="text-on-surface-variant">Token</span>
                    <span className="font-mono font-semibold text-on-surface">
                      {result.token}
                    </span>
                  </div>
                  <div className="flex justify-between font-['Inter'] text-sm">
                    <span className="text-on-surface-variant">Kit Size</span>
                    <span className="font-semibold text-on-surface">
                      {result.kit_size}
                    </span>
                  </div>
                  <div className="flex justify-between font-['Inter'] text-sm">
                    <span className="text-on-surface-variant">Pickup Location</span>
                    <span className="font-semibold text-on-surface">
                      {result.pickup_location}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 font-['Inter'] text-sm text-on-surface-variant">
                  <Mail className="w-4 h-4" />
                  A copy was sent to <strong>{result.buyer_email}</strong>
                </div>

                <a
                  href={result.qr}
                  download={`free-kit-${result.token}.png`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-primary text-primary font-['Inter'] text-sm font-semibold hover:bg-primary/5 transition"
                >
                  <Download className="w-4 h-4" /> Download QR Code
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>
    </main>
  );
}
