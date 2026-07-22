import { useState } from "react";
import { submitSponsorship } from "../services/sponsor.service";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  CheckCircle,
  X,
  Building2,
  Award,
  FileText,
  Star,
} from "lucide-react";

interface SponsorshipPackage {
  amount: string;
  label: string;
  name: string;
  subtitle: string;
  total: string;
  impact: { amount: string; description: string }[];
  recommended?: boolean;
}

const sponsorshipPackages: SponsorshipPackage[] = [
  {
    amount: "17500000",
    label: "Over RWF 15 Million",
    name: "Bisoke",
    subtitle: "Strategic Partner",
    total: "RWF 17,500,000",
    recommended: true,
    impact: [
      {
        amount: "RWF 10,000,000",
        description:
          "200 Tickets/ Walking Kits & Offers Visibility Rights at the Cancer Walk.",
      },
      {
        amount: "RWF 5,000,000",
        description:
          "Contribution towards the acquisition of THE SPECT Scan.",
      },
      {
        amount: "RWF 2,500,000",
        description:
          "Snacks & drinks for the VIP guests during The Kigali Cancer Walk.",
      },
    ],
  },
  {
    amount: "12500000",
    label: "RWF 10 Million to 15 Million",
    name: "Sabyinyo",
    subtitle: "Lead Programme Partner",
    total: "RWF 12,500,000",
    impact: [
      {
        amount: "RWF 7,500,000",
        description:
          "150 Tickets/ Walking Kits & Offers Visibility Rights at the Cancer Walk.",
      },
      {
        amount: "RWF 3,000,000",
        description:
          "Contribution towards the acquisition of THE SPECT Scan.",
      },
      {
        amount: "RWF 2,000,000",
        description:
          "Contribution towards the logistics of the KCW event.",
      },
    ],
  },
  {
    amount: "10000000",
    label: "Between 7.5 Million to 10 Million",
    name: "Gahinga",
    subtitle: "Programme Co-Sponsor",
    total: "RWF 10,000,000",
    impact: [
      {
        amount: "RWF 6,000,000",
        description:
          "120 Tickets/ Walking Kits & Offers Visibility Rights at the Cancer Walk.",
      },
      {
        amount: "RWF 2,500,000",
        description:
          "Contribution towards the acquisition of THE SPECT Scan.",
      },
      {
        amount: "RWF 1,500,000",
        description:
          "Contribution towards the logistics of the KCW event.",
      },
    ],
  },
  {
    amount: "7500000",
    label: "RWF 5 Million to 7.5 Million",
    name: "Nyiragongo",
    subtitle: "Event Partner",
    total: "RWF 7,500,000",
    impact: [
      {
        amount: "RWF 5,000,000",
        description:
          "100 Tickets/ Walking Kits & Offers Visibility Rights at the Cancer Walk.",
      },
      {
        amount: "RWF 1,500,000",
        description:
          "Contribution towards the acquisition of THE SPECT Scan.",
      },
      {
        amount: "RWF 1,000,000",
        description:
          "Contribution towards the logistics of the KCW event.",
      },
    ],
  },
  {
    amount: "5000000",
    label: "RWF 3 Million to 5 Million",
    name: "Nyamurangira",
    subtitle: "Impact Contributor",
    total: "RWF 5,000,000",
    impact: [
      {
        amount: "RWF 2,500,000",
        description:
          "50 Tickets/ Walking Kits & Offers Visibility Rights at the Cancer Walk.",
      },
      {
        amount: "RWF 1,500,000",
        description:
          "Contribution towards the acquisition of THE SPECT Scan.",
      },
      {
        amount: "RWF 1,000,000",
        description:
          "Contribution towards the logistics of the KCW event.",
      },
    ],
  },
];

export function SponsorsPage() {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    companyName: "",
    message: "",
  });

  const handlePackageSelect = (amount: string) => {
    setSelectedPackage(amount);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    if (!isSubmitting) {
      setIsModalOpen(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const pkg = sponsorshipPackages.find((p) => p.amount === selectedPackage)!;
      await submitSponsorship({
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        company_name: formData.companyName || undefined,
        message: formData.message || undefined,
        package_amount: pkg.amount,
        package_label: pkg.label,
      });

      setIsModalOpen(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 6000);
      setFormData({ fullName: "", email: "", phone: "", companyName: "", message: "" });
      setSelectedPackage(null);
    } catch {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToPackages = () => {
    document
      .getElementById("packages-section")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Premium Hero Section */}
      <section className="relative min-h-[auto] md:min-h-[700px] flex items-center overflow-hidden">
        {/* Dark Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-slate-900/80"></div>
          {/* Subtle pattern overlay */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
              backgroundSize: "40px 40px",
            }}
          ></div>
        </div>

        <div className="relative z-10 px-4 sm:px-6 md:px-gutter max-w-container-max mx-auto pt-12 pb-10 md:pt-20 md:pb-16 w-full">
          <motion.div
            className="max-w-4xl mx-auto text-center text-white"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8"
            >
              <Building2 className="w-5 h-5 text-secondary" />
              <span className="font-['Inter'] text-sm font-semibold tracking-wide">
                Corporate Partnership
              </span>
            </motion.div>

            <motion.h1
              className="font-['Plus_Jakarta_Sans'] text-[36px] sm:text-[48px] md:text-[64px] leading-[1.1] tracking-[-0.02em] font-extrabold mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Become a Sponsor
            </motion.h1>

            <motion.p
              className="font-['Inter'] text-[16px] md:text-[20px] leading-[1.6] font-normal text-white/90 mb-10 max-w-3xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
            
            </motion.p>

            <motion.div
              className="text-left max-w-2xl mx-auto mb-10 text-white/90 font-['Inter'] text-[15px] md:text-[17px] leading-[1.7] px-2 md:px-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <p className="mb-4">
                Your sponsorship will contribute to a transformational national
                health investment while providing your organization with:
              </p>
              <ul className="space-y-2 list-none">
                <li className="flex items-start gap-2">
                  <span className="mt-1 w-2 h-2 rounded-full bg-secondary flex-shrink-0" />
                  High-profile brand visibility across this activity.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 w-2 h-2 rounded-full bg-secondary flex-shrink-0" />
                  Recognition among key national and corporate stakeholders.
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 w-2 h-2 rounded-full bg-secondary flex-shrink-0" />
                  Alignment with impactful CSR priorities in health and community
                  well-being.
                </li>
              </ul>
            </motion.div>

            <motion.button
              onClick={scrollToPackages}
              className="bg-gradient-to-r from-secondary to-secondary/90 hover:from-secondary/90 hover:to-secondary text-white px-8 py-4 md:px-12 md:py-5 rounded-full font-['Inter'] text-[14px] md:text-[15px] leading-[1.2] tracking-[0.05em] font-semibold shadow-2xl shadow-secondary/30 transition-all active:scale-95 duration-200 inline-block border border-white/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{
                scale: 1.05,
                boxShadow: "0 25px 50px -12px rgba(184, 0, 73, 0.4)",
              }}
              whileTap={{ scale: 0.95 }}
            >
              Explore Sponsorship Packages
            </motion.button>

            {/* Trust Indicators */}
            <motion.div
              className="flex flex-wrap justify-center gap-4 md:gap-8 mt-8 md:mt-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center gap-3 text-white/80">
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <div className="font-['Inter'] text-sm font-semibold text-white">
                    Corporate Partnerships
                  </div>
                  <div className="font-['Inter'] text-xs text-white/60">
                    Trusted by leading organizations
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <div className="font-['Inter'] text-sm font-semibold text-white">
                    Verified Impact
                  </div>
                  <div className="font-['Inter'] text-xs text-white/60">
                    Annual reporting transparency
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <Shield className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <div className="font-['Inter'] text-sm font-semibold text-white">
                    NGO Certified
                  </div>
                  <div className="font-['Inter'] text-xs text-white/60">
                    Registered nonprofit organization
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Sponsorship Packages Section */}
      <section
        id="packages-section"
        className="py-stack-lg px-4 sm:px-6 lg:px-8 w-full bg-gradient-to-b from-surface to-slate-50"
      >
        <motion.div
          className="text-center mb-10 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-['Plus_Jakarta_Sans'] text-[30px] md:text-[48px] leading-[1.2] tracking-[-0.02em] font-bold text-on-surface mb-4">
            Sponsorship Packages
          </h2>
          <p className="font-['Inter'] text-[15px] md:text-[18px] leading-[1.6] font-normal text-on-surface-variant max-w-2xl mx-auto">
            Choose a partnership level that aligns with your corporate social
            responsibility goals.
          </p>
        </motion.div>

        {/* Scrollable on smaller screens, 5-col grid on xl */}
        <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 xl:gap-5 min-w-0 xl:min-w-[1200px] w-full mx-auto pt-5">
          {sponsorshipPackages.map((pkg, index) => (
            <motion.button
              key={pkg.amount}
              onClick={() => handlePackageSelect(pkg.amount)}
              className={`relative group p-5 md:p-8 rounded-3xl border-2 transition-all duration-500 ${
                selectedPackage === pkg.amount
                  ? "border-secondary bg-gradient-to-br from-secondary/5 to-secondary/10 shadow-2xl shadow-secondary/20 scale-105"
                  : "border-slate-200 bg-white hover:border-secondary/50 hover:shadow-xl hover:shadow-secondary/10 hover:scale-102"
              }`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.03, y: -5 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Recommended Badge */}
              {pkg.recommended && (
                <motion.div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-secondary to-secondary/80 text-white px-4 py-1.5 rounded-full font-['Inter'] text-xs font-semibold tracking-wide shadow-lg"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                >
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    Recommended
                  </span>
                </motion.div>
              )}

              <div className="text-center">
                <div className="font-['Plus_Jakarta_Sans'] text-[24px] md:text-[32px] leading-[1.2] font-extrabold text-on-surface mb-1">
                  {pkg.name}
                </div>
                <div className="font-['Inter'] text-sm font-semibold text-secondary tracking-wide mb-1">
                  {pkg.subtitle}
                </div>
                <div className="font-['Inter'] text-base font-medium text-on-surface-variant mb-3">
                  {pkg.label}
                </div>
                <div className="w-16 h-1 bg-gradient-to-r from-secondary to-secondary/60 mx-auto mb-6 rounded-full"></div>

                {/* Breakdown table */}
                <ul className="space-y-3 text-left mb-5">
                  {pkg.impact.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                      <div className="font-['Inter'] text-sm text-on-surface-variant leading-relaxed">
                        <span className="font-semibold text-on-surface">{item.amount}</span>
                        {" — "}
                        {item.description}
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                  <span className="font-['Inter'] text-xs text-on-surface-variant/80 font-medium">
                    Total
                  </span>
                  <span className="font-['Plus_Jakarta_Sans'] text-base font-bold text-secondary">
                    {pkg.total}
                  </span>
                </div>
              </div>

              {selectedPackage === pkg.amount && (
                <motion.div
                  className="absolute -top-2 -right-2 bg-secondary text-white rounded-full p-1.5 shadow-lg"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  <CheckCircle className="w-5 h-5" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
        </div>
      </section>

      {/* Sponsorship Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleModalClose}
          >
            <motion.div
              className="absolute inset-0 bg-slate-900/70 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <motion.div
              className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto border border-slate-200"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={handleModalClose}
                disabled={isSubmitting}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>

              {/* Modal Header */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-6 h-6 text-secondary" />
                  <h3 className="font-['Plus_Jakarta_Sans'] text-[28px] leading-[1.2] font-bold text-on-surface">
                    Become a Sponsor
                  </h3>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20">
                  <Award className="w-4 h-4" />
                  <span className="font-['Inter'] text-sm font-semibold">
                    You selected:{" "}
                    {
                      sponsorshipPackages.find(
                        (p) => p.amount === selectedPackage,
                      )?.label
                    }
                  </span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block font-['Inter'] text-sm font-semibold text-on-surface mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all font-['Inter'] text-base bg-white"
                    placeholder="Enter your name or organization"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block font-['Inter'] text-sm font-semibold text-on-surface mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all font-['Inter'] text-base bg-white"
                    placeholder="Enter your email address"
                  />
                </div>

                <div>
                  <label className="block font-['Inter'] text-sm font-semibold text-on-surface mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all font-['Inter'] text-base bg-white"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <label className="block font-['Inter'] text-sm font-semibold text-on-surface mb-2">
                    Company Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all font-['Inter'] text-base bg-white"
                    placeholder="Enter your company name"
                  />
                </div>

                <div>
                  <label className="block font-['Inter'] text-sm font-semibold text-on-surface mb-2">
                    Sponsorship Purpose / Message (Optional)
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all font-['Inter'] text-base bg-white resize-none"
                    placeholder="Tell us about your sponsorship goals"
                    rows={3}
                  />
                </div>

                {/* Error */}
                {submitError && (
                  <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-['Inter'] text-sm">
                    {submitError}
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleModalClose}
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3.5 rounded-xl border-2 border-slate-200 text-on-surface font-['Inter'] text-sm font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3.5 rounded-xl bg-gradient-to-r from-secondary to-secondary/90 hover:from-secondary/90 hover:to-secondary text-white font-['Inter'] text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-secondary/30"
                  >
                    {isSubmitting ? (
                      <>
                        <motion.div
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />
                        Processing...
                      </>
                    ) : (
                      "Continue to Agreement"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            className="fixed bottom-8 right-8 z-50 max-w-md"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="bg-white rounded-2xl shadow-2xl p-6 border-l-4 border-emerald-500 flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
              <div className="flex-grow">
                <h4 className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-on-surface mb-1">
                  Sponsorship Request Submitted
                </h4>
                <p className="font-['Inter'] text-sm text-on-surface-variant">
                  Thank you for your interest in sponsoring our mission. Our
                  partnership team will contact you shortly.
                </p>
              </div>
              <button
                onClick={() => setShowSuccess(false)}
                className="flex-shrink-0 p-1 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
