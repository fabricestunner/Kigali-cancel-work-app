import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Globe, Share2, Video } from "lucide-react";
import { eventInfo } from "../data";

export function Footer() {
  return (
    <footer className="w-full bg-surface-container-lowest dark:bg-surface-dim border-t border-outline-variant dark:border-outline">
      <div className="flex flex-col gap-stack-md px-gutter py-stack-lg w-full max-w-container-max mx-auto">
        <div className="grid lg:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-2 space-y-6">
            <span className="font-['Plus_Jakarta_Sans'] text-[24px] leading-[1.3] font-semibold text-primary font-bold">
              {eventInfo.title}
            </span>
            <p className="text-on-surface-variant font-['Inter'] text-[16px] leading-[1.6] font-normal max-w-sm">
              An initiative curated to raise awareness about cancer and
              fundraising to procure a Rwanda SPECT Scanner that will bring
              detection, diagnosis and follow up closer to Rwandans.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant hover:bg-primary hover:text-white transition-all"
              >
                <Globe className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant hover:bg-primary hover:text-white transition-all"
              >
                <Share2 className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant hover:bg-primary hover:text-white transition-all"
              >
                <Video className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-['Inter'] text-[14px] leading-[1.2] tracking-[0.05em] font-semibold text-on-surface font-bold mb-6">
              Quick Links
            </h4>
            <ul className="space-y-4">
              <li>
                <Link
                  to="/"
                  className="text-on-surface-variant hover:text-primary transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-on-surface-variant hover:text-primary transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/buy-kit"
                  className="text-on-surface-variant hover:text-primary transition-colors"
                >
                  Buy Kit
                </Link>
              </li>
              <li>
                <Link
                  to="/sponsors"
                  className="text-on-surface-variant hover:text-primary transition-colors"
                >
                  Sponsorships
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="text-on-surface-variant hover:text-primary transition-colors"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-['Inter'] text-[14px] leading-[1.2] tracking-[0.05em] font-semibold text-on-surface font-bold mb-6">
              Contact
            </h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-2 text-on-surface-variant">
                <Mail className="w-5 h-5 text-primary" />
                <a
                  href={`mailto:${eventInfo.email}`}
                  className="hover:text-primary transition-colors"
                >
                  {eventInfo.email}
                </a>
              </li>
              <li className="flex items-center gap-2 text-on-surface-variant">
                <Phone className="w-5 h-5 text-primary" />
                <a
                  href={`tel:${eventInfo.phone}`}
                  className="hover:text-primary transition-colors"
                >
                  {eventInfo.phone}
                </a>
              </li>
              <li className="flex items-center gap-2 text-on-surface-variant">
                <MapPin className="w-5 h-5 text-primary" />
                <span>{eventInfo.location}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-12 border-t border-outline-variant/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-on-surface-variant font-['Inter'] text-[14px] leading-[1.2] tracking-[0.05em] font-semibold">
            © 2026 Kigali Cancer Walk. All rights reserved.
          </p>
          <div className="flex gap-8">
            <Link
              to="#"
              className="text-on-surface-variant hover:text-primary font-['Inter'] text-[14px] leading-[1.2] tracking-[0.05em] font-semibold transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="#"
              className="text-on-surface-variant hover:text-primary font-['Inter'] text-[14px] leading-[1.2] tracking-[0.05em] font-semibold transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
