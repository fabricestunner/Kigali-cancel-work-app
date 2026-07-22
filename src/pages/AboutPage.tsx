import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Target,
  Eye,
  HeartPulse,
  Stethoscope,
  Microscope,
  Users,
  HandHeart,
  Sparkles,
  ArrowRight,
  MapPin,
  Quote,
} from "lucide-react";
import { stats, eventInfo } from "../data";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const statItems = [
  { icon: Users, value: stats.participants, label: "Participants to Join" },
  { icon: HandHeart, value: stats.fundsRaised, label: "Partners United" },
  {
    icon: HeartPulse,
    value: stats.survivorsWalking,
    label: "Survivors Walking",
  },
];

const pillars = [
  {
    icon: Stethoscope,
    title: "Early Detection",
    description:
      "Detecting cancer early dramatically improves survival rates. We champion screening and access to the SPECT Scanner services that will make it possible.",
    accent: "text-primary",
    ring: "bg-primary/10 group-hover:bg-primary",
  },
  {
    icon: HeartPulse,
    title: "Support & Care",
    description:
      "Survivors need emotional, physical, and financial support throughout their journey, not just at diagnosis, but every step after.",
    accent: "text-secondary",
    ring: "bg-secondary/10 group-hover:bg-secondary",
  },
  {
    icon: Microscope,
    title: "Research & Prevention",
    description:
      "Continued research advances prevention strategies and treatment innovation, building a healthier future for Rwanda.",
    accent: "text-primary",
    ring: "bg-primary/10 group-hover:bg-primary",
  },
];

export function AboutPage() {
  return (
    <main className="pt-20 overflow-hidden">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative px-gutter max-w-container-max mx-auto pt-12 pb-stack-lg">
        <div className="absolute -inset-x-40 -top-40 h-[420px] bg-gradient-to-br from-primary/10 to-secondary/10 blur-3xl -z-10" />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="max-w-3xl"
        >
          <motion.div
            variants={fadeUp}
            transition={{ type: "spring", stiffness: 100 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-['Inter'] text-[14px] font-semibold"
          >
            <Sparkles className="w-4 h-4" />
            <span>About the Movement</span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            transition={{ type: "spring", stiffness: 100 }}
            className="font-['Plus_Jakarta_Sans'] text-4xl sm:text-5xl lg:text-[56px] leading-[1.1] tracking-[-0.02em] font-extrabold text-on-surface mt-6"
          >
            Walking Together{" "}
            <span className="text-gradient">Against Cancer</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            transition={{ type: "spring", stiffness: 100 }}
            className="font-['Inter'] text-[17px] sm:text-[18px] leading-[1.6] text-on-surface-variant mt-6"
          >
            Kigali Cancer Walk 2026 An initiative curated to raise awareness
            about Cancer and Raise funds to acquire a Rwanda SPECT Scanner.
          </motion.p>

          <motion.div
            variants={fadeUp}
            transition={{ type: "spring", stiffness: 100 }}
            className="flex flex-wrap items-center gap-4 mt-8"
          >
            <Link to="/donate" className="button-primary">
              Support the Cause
            </Link>
            <span className="inline-flex items-center gap-2 text-on-surface-variant font-['Inter'] text-[14px] font-semibold">
              <MapPin className="w-4 h-4 text-secondary" />
              {eventInfo.location}
            </span>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Stats band ───────────────────────────────────────── */}
      <section className="bg-surface-container-low py-stack-lg">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="max-w-container-max mx-auto px-gutter grid grid-cols-1 sm:grid-cols-3 gap-gutter"
        >
          {statItems.map(({ icon: Icon, value, label }) => (
            <motion.div
              key={label}
              variants={fadeUp}
              transition={{ type: "spring", stiffness: 100 }}
              className="bg-surface p-8 rounded-3xl shadow-sm border border-outline-variant/30 flex items-center gap-5"
            >
              <div className="w-14 h-14 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Icon className="w-7 h-7" />
              </div>
              <div>
                <div className="font-['Plus_Jakarta_Sans'] text-[32px] leading-none font-bold text-on-surface">
                  {value}
                </div>
                <div className="font-['Inter'] text-[14px] tracking-[0.03em] font-semibold text-on-surface-variant mt-1">
                  {label}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Mission & Vision ─────────────────────────────────── */}
      <section className="px-gutter max-w-container-max mx-auto py-stack-lg">
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {[
            {
              icon: Target,
              tag: "Our Mission",
              tagCls: "bg-primary/10 text-primary",
              body: "Our mission is to mobilise $5 million USD to acquire a Rwanda SPECT Scanner that will help in diagnosis, detection and follow up checks in order to sustain lives. Every voucher you buy brings us closer.",
            },
            {
              icon: Eye,
              tag: "Our Vision",
              tagCls: "bg-secondary/10 text-secondary",
              body: "A Rwanda where every person affected by cancer receives the support they need, and where cancer research is prioritized as a public health imperative.",
            },
          ].map(({ icon: Icon, tag, tagCls, body }) => (
            <motion.div
              key={tag}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              transition={{ type: "spring", stiffness: 90 }}
              className="relative bg-surface p-8 lg:p-10 rounded-3xl border border-outline-variant/30 shadow-sm hover:shadow-md transition-shadow"
            >
              <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-bold ${tagCls}`}
              >
                <Icon className="w-4 h-4" />
                {tag}
              </div>
              <p className="font-['Inter'] text-[16px] sm:text-[17px] leading-[1.7] text-on-surface-variant mt-5">
                {body}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── The Cause (highlight) ────────────────────────────── */}
      <section className="px-gutter max-w-container-max mx-auto pb-stack-lg">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ type: "spring", stiffness: 80 }}
          className="relative overflow-hidden rounded-[28px] gradient-primary text-white p-8 sm:p-12 lg:p-16"
        >
          <Quote className="absolute -top-2 right-6 w-28 h-28 text-white/10" />
          <div className="max-w-3xl relative">
            <h2 className="font-['Plus_Jakarta_Sans'] text-3xl sm:text-4xl leading-[1.15] font-bold">
              Funding a Rwanda SPECT Scanner
            </h2>
            <p className="font-['Inter'] text-[16px] sm:text-[18px] leading-[1.7] text-white/90 mt-5">
              As part of the Kigali Cancer Walk movement we are setting out to
              raise funds for a SPECT Scanner. Access to Single Photon Emission
              Computed Tomography (SPECT) scanning/ imaging services in Rwanda
              is extremely limited, forcing many patients to seek these services
              outside the country at a high cost. SPECT is a nuclear medicine
              imaging technique that allows clinicians to see how organs and
              tissues are functioning, not just their structure. It is essential
              for:
            </p>
            <ul className="font-['Inter'] text-[16px] sm:text-[18px] leading-[1.7] text-white/90 mt-5 space-y-2 list-disc list-inside">
              <li>
                Staging cancer and monitoring whether treatment is working.
              </li>
              <li>
                Assessing heart muscle function and blood flow (cardiac
                perfusion imaging).
              </li>
              <li>
                Detecting bone metastases, infections, and stress fractures.
              </li>
              <li>Evaluating thyroid and kidney function.</li>
              <li>
                Diagnosing neurological conditions including epilepsy and
                Parkinson's disease.
              </li>
            </ul>
            <p className="font-['Inter'] text-[16px] sm:text-[18px] leading-[1.7] text-white/90 mt-5">
              Every kit purchased and every donation made brings life-saving
              diagnostic technology closer to the people who need it most.
            </p>
            <Link
              to="/donate"
              className="inline-flex items-center gap-2 bg-white text-primary font-bold px-7 py-3.5 rounded-full mt-8 shadow-xl hover:shadow-2xl transition-shadow"
            >
              <HandHeart className="w-5 h-5 text-secondary" />
              Donate Now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Why it matters ───────────────────────────────────── */}
      <section className="px-gutter max-w-container-max mx-auto pb-stack-lg">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 90 }}
          className="font-['Plus_Jakarta_Sans'] text-3xl sm:text-4xl leading-[1.2] font-bold text-on-surface text-center max-w-2xl mx-auto"
        >
          Why Cancer Awareness Matters
        </motion.h2>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12"
        >
          {pillars.map(({ icon: Icon, title, description, accent, ring }) => (
            <motion.div
              key={title}
              variants={fadeUp}
              transition={{ type: "spring", stiffness: 100 }}
              className="group bg-surface p-8 rounded-3xl border border-outline-variant/30 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div
                className={`w-14 h-14 rounded-2xl ${ring} ${accent} group-hover:text-white flex items-center justify-center mb-6 transition-colors duration-300`}
              >
                <Icon className="w-7 h-7" />
              </div>
              <h3
                className={`font-['Plus_Jakarta_Sans'] text-[22px] leading-[1.3] font-semibold ${accent} mb-3`}
              >
                {title}
              </h3>
              <p className="font-['Inter'] text-[16px] leading-[1.6] text-on-surface-variant">
                {description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Closing CTA ──────────────────────────────────────── */}
      <section className="px-gutter max-w-container-max mx-auto pb-stack-lg">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          transition={{ type: "spring", stiffness: 80 }}
          className="text-center bg-surface-container-low rounded-[28px] border border-outline-variant/30 px-6 py-12 sm:py-16"
        >
          <h2 className="font-['Plus_Jakarta_Sans'] text-3xl sm:text-4xl leading-[1.2] font-bold text-on-surface">
            Be part of the journey
          </h2>
          <p className="font-['Inter'] text-[16px] sm:text-[18px] leading-[1.6] text-on-surface-variant max-w-xl mx-auto mt-4">
            Walk, donate, or volunteer, together we can change the story of
            cancer in Rwanda.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Link to="/buy-kit" className="button-primary">
              Register Today
            </Link>
            <Link to="/donate" className="button-secondary">
              Make a Donation
            </Link>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
