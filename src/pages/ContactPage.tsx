import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Globe, Share2, Video } from "lucide-react";
import { eventInfo } from "../data";

export function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Thank you for your message. We will get back to you soon!");
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <main className="pt-20">
      <section className="py-stack-lg px-gutter max-w-container-max mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-['Plus_Jakarta_Sans'] text-[56px] leading-[1.1] tracking-[-0.02em] font-extrabold text-on-surface mb-4">
            Get in Touch
          </h1>
          <p className="font-['Inter'] text-[18px] leading-[1.6] font-normal text-on-surface-variant max-w-3xl mb-12">
            Have questions or want to partner with us? We'd love to hear from
            you.
          </p>

          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Form */}
            <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
              <div className="space-y-3">
                <label className="font-['Inter'] text-[14px] leading-[1.2] tracking-[0.05em] font-semibold text-on-surface">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-lg border border-outline-variant focus:border-primary outline-none transition"
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="font-['Inter'] text-[14px] leading-[1.2] tracking-[0.05em] font-semibold text-on-surface">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-lg border border-outline-variant focus:border-primary outline-none transition"
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="font-['Inter'] text-[14px] leading-[1.2] tracking-[0.05em] font-semibold text-on-surface">
                  Subject
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-lg border border-outline-variant focus:border-primary outline-none transition"
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="font-['Inter'] text-[14px] leading-[1.2] tracking-[0.05em] font-semibold text-on-surface">
                  Message
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  rows={6}
                  className="w-full px-4 py-3 rounded-lg border border-outline-variant focus:border-primary outline-none transition resize-none"
                  required
                />
              </div>

              <button type="submit" className="button-primary w-full">
                Send Message
              </button>
            </form>

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="bg-surface p-8 rounded-2xl border border-outline-variant/30 space-y-6">
                <h3 className="font-['Plus_Jakarta_Sans'] text-[24px] leading-[1.3] font-semibold text-on-surface">
                  Contact Information
                </h3>

                <div className="space-y-4">
                  <a
                    href={`mailto:${eventInfo.email}`}
                    className="flex items-start gap-4 p-4 rounded-lg hover:bg-surface-container/50 transition group"
                  >
                    <Mail className="w-6 h-6 text-primary flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="font-['Inter'] text-[14px] leading-[1.2] tracking-[0.05em] font-semibold text-on-surface-variant">
                        Email
                      </p>
                      <p className="font-['Inter'] text-[16px] leading-[1.6] font-normal text-on-surface">
                        {eventInfo.email}
                      </p>
                    </div>
                  </a>

                  <a
                    href={`tel:${eventInfo.phone}`}
                    className="flex items-start gap-4 p-4 rounded-lg hover:bg-surface-container/50 transition group"
                  >
                    <Phone className="w-6 h-6 text-secondary flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="font-['Inter'] text-[14px] leading-[1.2] tracking-[0.05em] font-semibold text-on-surface-variant">
                        Phone
                      </p>
                      <p className="font-['Inter'] text-[16px] leading-[1.6] font-normal text-on-surface">
                        {eventInfo.phone}
                      </p>
                    </div>
                  </a>

                  <div className="flex items-start gap-4 p-4 rounded-lg">
                    <MapPin className="w-6 h-6 text-tertiary flex-shrink-0" />
                    <div>
                      <p className="font-['Inter'] text-[14px] leading-[1.2] tracking-[0.05em] font-semibold text-on-surface-variant">
                        Location
                      </p>
                      <p className="font-['Inter'] text-[16px] leading-[1.6] font-normal text-on-surface">
                        {eventInfo.location}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-outline-variant pt-6">
                  <p className="font-['Inter'] text-[14px] leading-[1.2] tracking-[0.05em] font-semibold text-on-surface-variant mb-4">
                    Follow Us
                  </p>
                  <div className="flex gap-4">
                    <a
                      href="#"
                      className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition"
                    >
                      <Globe className="w-5 h-5" />
                    </a>
                    <a
                      href="#"
                      className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition"
                    >
                      <Share2 className="w-5 h-5" />
                    </a>
                    <a
                      href="#"
                      className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition"
                    >
                      <Video className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
