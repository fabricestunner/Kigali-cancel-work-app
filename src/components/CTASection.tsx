import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export function CTASection() {
  return (
    <section className="py-8 px-gutter max-w-container-max mx-auto mb-stack-lg">
      <motion.div
        className="gradient-primary rounded-[48px] p-12 lg:p-24 relative overflow-hidden text-center text-white"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        {/* Background Decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>

        {/* Content */}
        <motion.div
          className="relative z-10 max-w-2xl mx-auto space-y-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          <motion.h2
            className="font-['Plus_Jakarta_Sans'] text-[56px] leading-[1.1] tracking-[-0.02em] font-extrabold"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Ready to make an impact?
          </motion.h2>
          <motion.p
            className="font-['Inter'] text-[18px] leading-[1.6] font-normal text-white/90"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            Whether you decide to walk, donate, or partner with us, your support
            will truly make a meaningful difference in saving lives.
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <Link
              to="/buy-kit"
              className="bg-white text-primary px-10 py-5 rounded-full font-['Inter'] text-[14px] leading-[1.2] tracking-[0.05em] font-semibold shadow-2xl hover:bg-surface-container-low transition-colors active:scale-95 duration-200 inline-block"
            >
              Register Buy a Kit
            </Link>
            <Link
              to="/donate"
              className="bg-transparent border-2 border-white/40 text-white px-10 py-5 rounded-full font-['Inter'] text-[14px] leading-[1.2] tracking-[0.05em] font-semibold hover:bg-white/10 transition-colors active:scale-95 duration-200 inline-block"
            >
              Buy a Voucher to Donate
            </Link>
            <Link
              to="/sponsors"
              className="bg-transparent border-2 border-white/40 text-white px-10 py-5 rounded-full font-['Inter'] text-[14px] leading-[1.2] tracking-[0.05em] font-semibold hover:bg-white/10 transition-colors active:scale-95 duration-200 inline-block"
            >
              Become a Sponsor
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
