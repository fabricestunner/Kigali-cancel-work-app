import { motion } from "framer-motion";
import rotaryLogo from "../assets/RCKV-Website-Mockup.png";
import rgConsultLogo from "../assets/Partners/RG consult inc.png";
import rbcLogo from "../assets/Partners/rbc Logo.png";
import rgTicketsLogo from "../assets/Partners/RG tickets.jpg";
import cityKigaliLogo from "../assets/Partners/city of Kigali.jpg";
import mohLogo from "../assets/Partners/MoH.jpg";
import ncbaLogo from "../assets/Partners/NCBA.png";
import imLogo from "../assets/Partners/I&M.jpg";

const partners = [
  { name: "Rotary Club of Kigali Virunga", logo: rotaryLogo },
  { name: "RG Consult Inc", logo: rgConsultLogo },
  { name: "Rwanda Biomedical Centre", logo: rbcLogo },
  { name: "RG Tickets", logo: rgTicketsLogo },
  { name: "City of Kigali", logo: cityKigaliLogo },
  { name: "Ministry of Health", logo: mohLogo },
  { name: "NCBA Bank", logo: ncbaLogo },
  { name: "I&M Bank", logo: imLogo },
];

// Duplicate list to create a seamless infinite scroll
const marqueeItems = [...partners, ...partners];

export function PartnersSection() {
  return (
    <section
      id="partners"
      className="scroll-mt-24 py-16 bg-white relative overflow-hidden border-t border-outline-variant/20"
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.04)_1px,transparent_0)] [background-size:32px_32px] pointer-events-none" />

      <div className="max-w-container-max mx-auto px-gutter relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <motion.span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/8 border border-primary/20 text-primary font-['Inter'] text-xs font-bold tracking-[0.12em] uppercase mb-5"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
            Our Partners &amp; Supporters
          </motion.span>

          <motion.h2
            className="font-['Plus_Jakarta_Sans'] text-[32px] md:text-[40px] font-bold text-on-surface leading-tight tracking-tight"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
          >
            Proudly Supported By
          </motion.h2>

          <motion.p
            className="font-['Inter'] text-on-surface-variant text-[16px] mt-3 max-w-md mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Together with our valued partners, we are making a lasting impact on
            cancer awareness across Rwanda.
          </motion.p>
        </motion.div>

        {/* Infinite marquee — pauses on hover */}
        <motion.div
          className="marquee group/marquee relative"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-12 md:w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 md:w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

          <div className="overflow-hidden py-2">
            <div className="marquee-track flex gap-4 md:gap-5 w-max">
              {marqueeItems.map((partner, i) => (
                <div
                  key={i}
                  className="group/card relative flex flex-col items-center justify-center gap-3 p-5 md:p-6 bg-surface rounded-2xl border border-outline-variant/40 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 min-w-[150px] md:min-w-[200px] flex-shrink-0 transition-all duration-300 will-change-transform hover:-translate-y-1.5 cursor-pointer"
                >
                  {/* Glow on hover */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  <div className="relative h-12 md:h-14 w-full flex items-center justify-center">
                    <img
                      src={partner.logo}
                      alt={partner.name}
                      className="max-h-12 md:max-h-14 max-w-[120px] md:max-w-full object-contain"
                    />
                  </div>

                  <span className="font-['Inter'] text-xs font-semibold text-on-surface-variant group-hover/card:text-primary transition-colors duration-300 text-center leading-snug">
                    {partner.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Bottom trust line */}
        <motion.div
          className="mt-10 flex items-center justify-center gap-3"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <div className="h-px bg-outline-variant/40 flex-1 max-w-[80px]" />
          <p className="font-['Inter'] text-xs text-on-surface-variant/60 text-center">
            Join our growing community of partners making a difference
          </p>
          <div className="h-px bg-outline-variant/40 flex-1 max-w-[80px]" />
        </motion.div>
      </div>

      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track {
          animation: marquee 32s linear infinite;
        }
        /* Pause the scroll while hovering anywhere over the marquee */
        .marquee:hover .marquee-track {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-track {
            animation: none;
            flex-wrap: wrap;
            justify-content: center;
          }
        }
      `}</style>
    </section>
  );
}
