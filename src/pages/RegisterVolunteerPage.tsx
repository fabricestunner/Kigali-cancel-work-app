import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, CheckCircle2, AlertCircle } from "lucide-react";
import {
  submitVolunteer,
  type VolunteerAffiliation,
} from "../services/volunteer.service";

const AFFILIATION_OPTIONS: { value: VolunteerAffiliation; label: string }[] = [
  { value: "rotaractor", label: "Rotaractor" },
  { value: "rotarian", label: "Rotarian" },
  { value: "none", label: "None" },
];

const TEAM_OPTIONS = ["Kit Selling Team", "Protocol Team"];

export function RegisterVolunteerPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    affiliation: "" as "" | VolunteerAffiliation,
    team: "",
    rotaryClub: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await submitVolunteer({
        full_name: form.fullName,
        email: form.email,
        phone: form.phone || undefined,
        affiliation: form.affiliation || "none",
        team: form.affiliation === "rotaractor" ? form.team : undefined,
        rotary_club:
          form.affiliation === "rotarian" ? form.rotaryClub : undefined,
      });
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <main className="pt-20">
        <section className="py-stack-lg px-gutter max-w-container-max mx-auto flex flex-col items-center text-center gap-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 120 }}
          >
            <CheckCircle2 className="w-20 h-20 text-primary mx-auto" />
          </motion.div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-[40px] font-extrabold text-on-surface tracking-[-0.02em]">
            Application Received!
          </h1>
          <p className="font-['Inter'] text-[17px] text-on-surface-variant max-w-md leading-relaxed">
            Thank you, <strong>{form.fullName}</strong>. We'll review your
            volunteer application and get back to you at{" "}
            <strong>{form.email}</strong> shortly.
          </p>
        </section>
      </main>
    );
  }

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
              <Heart className="w-4 h-4" />
              <span>Volunteer Registration</span>
            </div>
            <h1 className="font-['Plus_Jakarta_Sans'] text-[40px] leading-[1.1] tracking-[-0.02em] font-extrabold text-on-surface">
              Register as a Volunteer
            </h1>
            <p className="font-['Inter'] text-[16px] text-on-surface-variant leading-relaxed">
              Give your time and energy to support the Kigali Cancer Walk. Fill
              in the form below and we'll be in touch.
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-surface-container-low border border-outline-variant rounded-3xl p-8 space-y-6"
          >
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="font-['Inter'] text-[14px] font-semibold text-on-surface">
                Full Name <span className="text-error">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                required
                value={form.fullName}
                onChange={handleChange}
                placeholder="e.g. Amina Uwase"
                className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface font-['Inter'] text-[15px] text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary transition"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="font-['Inter'] text-[14px] font-semibold text-on-surface">
                Email Address <span className="text-error">*</span>
              </label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface font-['Inter'] text-[15px] text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary transition"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="font-['Inter'] text-[14px] font-semibold text-on-surface">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+250 7XX XXX XXX"
                className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface font-['Inter'] text-[15px] text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary transition"
              />
            </div>

            {/* Affiliation */}
            <div className="space-y-1.5">
              <label className="font-['Inter'] text-[14px] font-semibold text-on-surface">
                Are you a Rotaractor or Rotarian?{" "}
                <span className="text-error">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {AFFILIATION_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center justify-center px-3 py-3 rounded-xl border cursor-pointer font-['Inter'] text-[14px] font-medium transition ${
                      form.affiliation === opt.value
                        ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                        : "border-outline-variant bg-surface text-on-surface hover:border-primary/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="affiliation"
                      value={opt.value}
                      required
                      checked={form.affiliation === opt.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Rotaractor: preferred team */}
            {form.affiliation === "rotaractor" && (
              <div className="space-y-1.5">
                <label className="font-['Inter'] text-[14px] font-semibold text-on-surface">
                  Preferred Volunteer Team <span className="text-error">*</span>
                </label>
                <select
                  name="team"
                  required
                  value={form.team}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface font-['Inter'] text-[15px] text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition"
                >
                  <option value="" disabled>
                    Select a team…
                  </option>
                  {TEAM_OPTIONS.map((team) => (
                    <option key={team} value={team}>
                      {team}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Rotarian: club name */}
            {form.affiliation === "rotarian" && (
              <div className="space-y-1.5">
                <label className="font-['Inter'] text-[14px] font-semibold text-on-surface">
                  Rotary Club Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  name="rotaryClub"
                  required
                  value={form.rotaryClub}
                  onChange={handleChange}
                  placeholder="e.g. Rotary Club of Kigali"
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface font-['Inter'] text-[15px] text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary transition"
                />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-['Inter'] text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-primary text-white py-4 rounded-full font-['Inter'] text-[15px] font-semibold tracking-[0.03em] hover:opacity-90 active:scale-[0.98] transition duration-200 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Submitting…" : "Submit Application"}
            </button>
          </form>
        </motion.div>
      </section>
    </main>
  );
}
