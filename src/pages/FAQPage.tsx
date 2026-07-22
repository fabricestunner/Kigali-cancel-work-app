import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { faqs } from "../data";
import { ChevronDown } from "lucide-react";

export function FAQPage() {
  const [openId, setOpenId] = useState<string | null>(null);

  const categories = Array.from(new Set(faqs.map((faq) => faq.category)));

  return (
    <main className="pt-20">
      <section className="py-stack-lg px-gutter max-w-container-max mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-['Plus_Jakarta_Sans'] text-[56px] leading-[1.1] tracking-[-0.02em] font-extrabold text-on-surface mb-4">
            Frequently Asked Questions
          </h1>
          <p className="font-['Inter'] text-[18px] leading-[1.6] font-normal text-on-surface-variant max-w-3xl mb-12">
            Find answers to common questions about the Kigali Cancer Walk 2026.
          </p>

          {categories.map((category, categoryIndex) => {
            const categoryFaqs = faqs.filter(
              (faq) => faq.category === category,
            );

            return (
              <div key={category} className="mb-12">
                <h2 className="font-['Plus_Jakarta_Sans'] text-[40px] leading-[1.2] font-bold text-on-surface mb-6 capitalize">
                  {category}
                </h2>

                <div className="space-y-4">
                  {categoryFaqs.map((faq, faqIndex) => (
                    <motion.div
                      key={faq.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: categoryIndex * 0.05 + faqIndex * 0.05,
                      }}
                      className="border border-outline-variant/30 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <button
                        onClick={() =>
                          setOpenId(openId === faq.id ? null : faq.id)
                        }
                        className="w-full px-6 py-4 flex items-center justify-between bg-surface hover:bg-surface-container/50 transition"
                      >
                        <h3 className="font-['Plus_Jakarta_Sans'] text-[24px] leading-[1.3] font-semibold text-on-surface text-left">
                          {faq.question}
                        </h3>
                        <motion.div
                          animate={{ rotate: openId === faq.id ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ChevronDown className="w-6 h-6 text-primary flex-shrink-0" />
                        </motion.div>
                      </button>

                      <AnimatePresence>
                        {openId === faq.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="border-t border-outline-variant/30 bg-surface-container/30 px-6 py-4"
                          >
                            <p className="font-['Inter'] text-[16px] leading-[1.6] font-normal text-on-surface-variant">
                              {faq.answer}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Still have questions */}
          <motion.div
            className="gradient-primary rounded-2xl p-12 text-center text-white mt-stack-lg"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="font-['Plus_Jakarta_Sans'] text-[40px] leading-[1.2] font-bold mb-4">
              Still Have Questions?
            </h3>
            <p className="font-['Inter'] text-[18px] leading-[1.6] font-normal text-white/90 mb-6">
              Contact our support team for more information.
            </p>
            <a
              href="mailto:info@kigalicancerwalk.rw"
              className="inline-block bg-white text-primary px-8 py-3 rounded-full font-['Inter'] text-[14px] leading-[1.2] tracking-[0.05em] font-semibold hover:bg-gray-100 transition"
            >
              Get in Touch
            </a>
          </motion.div>
        </motion.div>
      </section>
    </main>
  );
}
