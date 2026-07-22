import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Zap, CheckCircle, CreditCard, Smartphone, ArrowLeft, Download, Home } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  type: "mobile" | "card";
}

interface DonationSummary {
  fullName: string;
  email: string;
  phone: string;
  amount: string;
  amountLabel: string;
}

interface PaymentFormDetails {
  phoneNumber: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: "mtn",
    name: "MTN Mobile Money",
    description: "Fast & widely used",
    icon: <Smartphone className="w-6 h-6" />,
    type: "mobile",
  },
  {
    id: "airtel",
    name: "Airtel Money",
    description: "Quick & convenient",
    icon: <Smartphone className="w-6 h-6" />,
    type: "mobile",
  },
  {
    id: "visa",
    name: "Visa",
    description: "Credit or debit card",
    icon: <CreditCard className="w-6 h-6" />,
    type: "card",
  },
  {
    id: "mastercard",
    name: "Mastercard",
    description: "Credit or debit card",
    icon: <CreditCard className="w-6 h-6" />,
    type: "card",
  },
];

export function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { donationData } = location.state || {};

  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({
    phoneNumber: donationData?.phone || "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
  });

  if (!donationData) {
    navigate("/donate");
    return null;
  }

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 3000));

    setIsProcessing(false);
    setShowSuccess(true);
  };

  const handleBack = () => {
    navigate("/donate");
  };

  if (showSuccess) {
    return <PaymentSuccessPage donationData={donationData} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Page Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="px-gutter max-w-container-max mx-auto py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-['Inter'] text-sm font-medium">Back</span>
            </button>
            <h1 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-slate-900">
              Complete Your Donation
            </h1>
            <div className="w-20" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Trust Banner */}
      <div className="bg-blue-50 border-b border-blue-100">
        <div className="px-gutter max-w-container-max mx-auto py-3">
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-slate-700">
              <Lock className="w-4 h-4 text-blue-600" />
              <span className="font-['Inter']">Secure encrypted payment</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="font-['Inter']">Fast processing</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span className="font-['Inter']">Verified nonprofit</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-gutter max-w-container-max mx-auto py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-slate-900 mb-2">
                Your donation is secure and will be processed instantly.
              </h2>
              <p className="font-['Inter'] text-slate-600 mb-8">
                Select your preferred payment method below.
              </p>

              {/* Payment Method Selection */}
              <div className="mb-8">
                <h3 className="font-['Inter'] text-lg font-semibold text-slate-900 mb-4">
                  Payment Method
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {paymentMethods.map((method) => (
                    <PaymentMethodCard
                      key={method.id}
                      method={method}
                      isSelected={selectedMethod === method.id}
                      onSelect={() => handleMethodSelect(method.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Payment Form */}
              <AnimatePresence>
                {selectedMethod && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <PaymentForm
                      selectedMethod={selectedMethod}
                      paymentDetails={paymentDetails}
                      onChange={setPaymentDetails}
                      amount={donationData.amount}
                      onSubmit={handlePayment}
                      isProcessing={isProcessing}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Donation Summary (Sticky on Desktop) */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <DonationSummaryCard donationData={donationData} />
            </div>
          </div>
        </div>
      </div>

      {/* Full Page Loading State */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <motion.div
                className="w-16 h-16 mx-auto mb-6 rounded-full border-4 border-blue-200 border-t-blue-600"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <h3 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-slate-900 mb-2">
                Processing your donation...
              </h3>
              <p className="font-['Inter'] text-slate-600">
                Please do not close this page.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Reusable Components

function PaymentMethodCard({
  method,
  isSelected,
  onSelect,
}: {
  method: PaymentMethod;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      onClick={onSelect}
      className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${
        isSelected
          ? "border-blue-600 bg-blue-50 shadow-lg"
          : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-md"
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start gap-4">
        <div
          className={`p-3 rounded-xl ${
            isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
          }`}
        >
          {method.icon}
        </div>
        <div className="text-left flex-1">
          <div className="font-['Inter'] text-base font-semibold text-slate-900 mb-1">
            {method.name}
          </div>
          <div className="font-['Inter'] text-sm text-slate-600">
            {method.description}
          </div>
        </div>
        {isSelected && (
          <motion.div
            className="absolute top-4 right-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <CheckCircle className="w-6 h-6 text-blue-600" />
          </motion.div>
        )}
      </div>
    </motion.button>
  );
}

function DonationSummaryCard({ donationData }: { donationData: DonationSummary }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <motion.div
      className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-slate-900">
          Donation Summary
        </h3>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg
            className="w-5 h-5 text-slate-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 space-y-4 border-t border-slate-100">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-['Inter'] text-sm text-slate-600">Name</span>
                  <span className="font-['Inter'] text-sm font-medium text-slate-900">
                    {donationData.fullName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-['Inter'] text-sm text-slate-600">Email</span>
                  <span className="font-['Inter'] text-sm font-medium text-slate-900">
                    {donationData.email}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-['Inter'] text-sm text-slate-600">Phone</span>
                  <span className="font-['Inter'] text-sm font-medium text-slate-900">
                    {donationData.phone}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="font-['Inter'] text-sm text-slate-600">Amount</span>
                  <span className="font-['Inter'] text-sm font-medium text-slate-900">
                    {donationData.amountLabel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-['Inter'] text-sm text-slate-600">Type</span>
                  <span className="font-['Inter'] text-sm font-medium text-slate-900">
                    One-time donation
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-['Plus_Jakarta_Sans'] text-base font-bold text-slate-900">
                    Total
                  </span>
                  <span className="font-['Plus_Jakarta_Sans'] text-2xl font-bold text-blue-600">
                    {donationData.amountLabel}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function PaymentForm({
  selectedMethod,
  paymentDetails,
  onChange,
  amount,
  onSubmit,
  isProcessing,
}: {
  selectedMethod: string;
  paymentDetails: PaymentFormDetails;
  onChange: (details: PaymentFormDetails) => void;
  amount: string;
  onSubmit: (e: React.FormEvent) => void;
  isProcessing: boolean;
}) {
  const isMobileMoney = selectedMethod === "mtn" || selectedMethod === "airtel";
  const isCard = selectedMethod === "visa" || selectedMethod === "mastercard";

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {isMobileMoney && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h4 className="font-['Inter'] text-lg font-semibold text-slate-900 mb-4">
            Mobile Money Details
          </h4>
          <div>
            <label className="block font-['Inter'] text-sm font-semibold text-slate-900 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              required
              value={paymentDetails.phoneNumber}
              onChange={(e) =>
                onChange({ ...paymentDetails, phoneNumber: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all font-['Inter'] text-base"
              placeholder="+250 XXX XXX XXX"
            />
          </div>
        </div>
      )}

      {isCard && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h4 className="font-['Inter'] text-lg font-semibold text-slate-900 mb-4">
            Card Details
          </h4>
          <div className="space-y-4">
            <div>
              <label className="block font-['Inter'] text-sm font-semibold text-slate-900 mb-2">
                Card Number
              </label>
              <input
                type="text"
                required
                value={paymentDetails.cardNumber}
                onChange={(e) =>
                  onChange({ ...paymentDetails, cardNumber: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all font-['Inter'] text-base"
                placeholder="1234 5678 9012 3456"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-['Inter'] text-sm font-semibold text-slate-900 mb-2">
                  Expiry Date
                </label>
                <input
                  type="text"
                  required
                  value={paymentDetails.expiryDate}
                  onChange={(e) =>
                    onChange({ ...paymentDetails, expiryDate: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all font-['Inter'] text-base"
                  placeholder="MM/YY"
                />
              </div>
              <div>
                <label className="block font-['Inter'] text-sm font-semibold text-slate-900 mb-2">
                  CVV
                </label>
                <input
                  type="text"
                  required
                  value={paymentDetails.cvv}
                  onChange={(e) =>
                    onChange({ ...paymentDetails, cvv: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all font-['Inter'] text-base"
                  placeholder="123"
                />
              </div>
            </div>
            <div>
              <label className="block font-['Inter'] text-sm font-semibold text-slate-900 mb-2">
                Cardholder Name
              </label>
              <input
                type="text"
                required
                value={paymentDetails.cardholderName}
                onChange={(e) =>
                  onChange({ ...paymentDetails, cardholderName: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all font-['Inter'] text-base"
                placeholder="John Doe"
              />
            </div>
          </div>
        </div>
      )}

      {/* Pay Button */}
      <button
        type="submit"
        disabled={isProcessing}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-['Inter'] text-base font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/30"
      >
        {isProcessing ? "Processing..." : `Pay ${amount} FRW`}
      </button>

      {/* Security Message */}
      <div className="flex items-center justify-center gap-2 text-slate-600 text-sm">
        <Lock className="w-4 h-4" />
        <span className="font-['Inter']">
          Your payment is encrypted and secure. We do not store card or mobile money credentials.
        </span>
      </div>
    </form>
  );
}

function PaymentSuccessPage({ donationData }: { donationData: DonationSummary }) {
  const navigate = useNavigate();
  const transactionId = `TXN-${Date.now()}`;
  const date = new Date().toLocaleString();

  const handleDownloadReceipt = () => {
    // Simulate download
    alert("Receipt downloaded!");
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-gutter">
      <motion.div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 text-center"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Success Icon */}
        <motion.div
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", damping: 15 }}
        >
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </motion.div>

        {/* Title */}
        <motion.h1
          className="font-['Plus_Jakarta_Sans'] text-3xl font-bold text-slate-900 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Thank You for Your Donation!
        </motion.h1>

        {/* Message */}
        <motion.p
          className="font-['Inter'] text-lg text-slate-600 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Your support makes a real difference. We appreciate your generosity.
        </motion.p>

        {/* Details */}
        <motion.div
          className="bg-slate-50 rounded-xl p-6 mb-8 text-left"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="font-['Inter'] text-sm text-slate-600">Transaction ID</span>
              <span className="font-['Inter'] text-sm font-medium text-slate-900">
                {transactionId}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-['Inter'] text-sm text-slate-600">Amount Donated</span>
              <span className="font-['Inter'] text-sm font-medium text-slate-900">
                {donationData.amountLabel}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-['Inter'] text-sm text-slate-600">Date & Time</span>
              <span className="font-['Inter'] text-sm font-medium text-slate-900">
                {date}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <button
            onClick={handleDownloadReceipt}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-900 font-['Inter'] text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Receipt
          </button>
          <button
            onClick={handleBackToHome}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-['Inter'] text-sm font-semibold transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
