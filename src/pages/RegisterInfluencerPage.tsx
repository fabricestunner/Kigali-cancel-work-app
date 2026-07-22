import { useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, CheckCircle2, Users, AlertCircle } from "lucide-react";
import { submitInfluencer } from "../services/influencer.service";

const socialPlatforms = [
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "twitter", label: "Twitter / X" },
  { key: "tiktok", label: "TikTok" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "youtube", label: "YouTube" },
];

// A pasted link must be a profile URL on one of these social platforms
// (optional scheme/www, a recognised domain, then a non-empty path).
const SOCIAL_LINK_REGEX =
  /^(https?:\/\/)?(www\.)?(facebook\.com|instagram\.com|twitter\.com|x\.com|linkedin\.com|tiktok\.com|youtube\.com)\/[A-Za-z0-9._\-/]+\/?$/;

/**
 * Validate a pasted profile link.
 * Returns an error message, or null when the link is valid.
 */
function validateProfileLink(raw: string): string | null {
  const value = raw.trim();
  if (!value) return "Please paste your profile link.";
  if (!SOCIAL_LINK_REGEX.test(value)) {
    return "Enter a valid social media profile link (e.g. https://instagram.com/yourhandle).";
  }
  return null;
}

export function RegisterInfluencerPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
  });
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [profileLinks, setProfileLinks] = useState<Record<string, string>>({});
  const [linkErrors, setLinkErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const togglePlatform = (key: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key],
    );
    // Drop any stale error for a platform that's being deselected.
    setLinkErrors((prev) => {
      const rest = { ...prev };
      delete rest[key];
      return rest;
    });
  };

  const handleProfileLinkChange = (key: string, value: string) => {
    setProfileLinks((prev) => ({ ...prev, [key]: value }));
    // Clear the error as the user edits; it's re-checked on blur/submit.
    setLinkErrors((prev) => {
      if (!prev[key]) return prev;
      const rest = { ...prev };
      delete rest[key];
      return rest;
    });
  };

  const handleProfileLinkBlur = (key: string) => {
    const err = validateProfileLink(profileLinks[key] ?? "");
    setLinkErrors((prev) => ({ ...prev, [key]: err ?? "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate every selected platform's pasted link before submitting.
    const errors: Record<string, string> = {};
    for (const key of selectedPlatforms) {
      const err = validateProfileLink(profileLinks[key] ?? "");
      if (err) errors[key] = err;
    }
    if (Object.keys(errors).length > 0) {
      setLinkErrors(errors);
      setError("Please fix the highlighted profile links before submitting.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const social_media =
        selectedPlatforms.length > 0
          ? Object.fromEntries(
              selectedPlatforms.map((p) => [p, (profileLinks[p] ?? "").trim()]),
            )
          : undefined;
      await submitInfluencer({
        full_name: form.fullName,
        email: form.email,
        phone: form.phone || undefined,
        social_media,
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
            application and get back to you at <strong>{form.email}</strong>{" "}
            shortly.
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
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-['Inter'] text-[13px] tracking-[0.05em] font-semibold">
              <Briefcase className="w-4 h-4" />
              <span>Influencer Registration</span>
            </div>
            <h1 className="font-['Plus_Jakarta_Sans'] text-[40px] leading-[1.1] tracking-[-0.02em] font-extrabold text-on-surface">
              Register as an Influencer
            </h1>
            <p className="font-['Inter'] text-[16px] text-on-surface-variant leading-relaxed">
              Fill in the form below and our team will reach out with next
              steps.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-surface-container-low border border-outline-variant rounded-3xl p-8 space-y-6"
          >
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

            {/* Social Media Followers */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="font-['Inter'] text-[14px] font-semibold text-on-surface">
                  Social Media Followers
                </span>
              </div>
              <p className="font-['Inter'] text-[13px] text-on-surface-variant">
                Select any platforms you use, then enter The Link to your
                profile.
              </p>

              {/* Platform chips */}
              <div className="flex flex-wrap gap-2">
                {socialPlatforms.map(({ key, label }) => {
                  const active = selectedPlatforms.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => togglePlatform(key)}
                      className={`px-4 py-2 rounded-full font-['Inter'] text-[13px] font-semibold border transition-all duration-200 ${
                        active
                          ? "gradient-primary text-white border-transparent shadow-sm"
                          : "bg-surface border-outline-variant text-on-surface-variant hover:border-primary/50"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Follower inputs — shown only for selected platforms */}
              {selectedPlatforms.length > 0 && (
                <div className="space-y-3 pt-1">
                  {selectedPlatforms.map((key) => {
                    const label =
                      socialPlatforms.find((p) => p.key === key)?.label ?? key;
                    const fieldError = linkErrors[key];
                    return (
                      <div key={key} className="flex items-start gap-3">
                        <span className="w-28 shrink-0 pt-2.5 font-['Inter'] text-[13px] font-semibold text-on-surface">
                          {label}
                        </span>
                        <div className="flex-1 space-y-1">
                          <input
                            type="url"
                            inputMode="url"
                            placeholder={`Paste link to your ${label} profile`}
                            value={profileLinks[key] ?? ""}
                            onChange={(e) =>
                              handleProfileLinkChange(key, e.target.value)
                            }
                            onBlur={() => handleProfileLinkBlur(key)}
                            aria-invalid={!!fieldError}
                            className={`w-full px-4 py-2.5 rounded-xl border bg-surface font-['Inter'] text-[14px] text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 transition ${
                              fieldError
                                ? "border-error focus:ring-error"
                                : "border-outline-variant focus:ring-primary"
                            }`}
                          />
                          {fieldError && (
                            <p className="flex items-center gap-1.5 font-['Inter'] text-[12px] text-error">
                              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                              {fieldError}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
