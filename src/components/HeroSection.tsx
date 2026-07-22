import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CountdownTimer } from "./CountdownTimer";
import { Megaphone } from "lucide-react";
import { eventInfo } from "../data";
import heroImage from "../assets/heroImage.jpeg";

export function HeroSection() {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  };

  return (
    <section className="relative overflow-hidden px-gutter max-w-container-max mx-auto pt-12 pb-2">
      {/* Background Glow */}
      <div className="absolute -inset-40 bg-gradient-to-br from-primary/5 to-secondary/5 blur-3xl -z-10"></div>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center w-full py-4">
        {/* LEFT CONTENT */}
        <motion.div
          className="space-y-8"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.2,
                delayChildren: 0.1,
              },
            },
          }}
        >
          {/* Badge */}
          <motion.div
            variants={itemVariants}
            transition={{ type: "spring", stiffness: 100 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-['Inter'] text-[14px] font-semibold"
          >
            <Megaphone className="w-5 h-5" />
            <span>
              {eventInfo.registrationOpen
                ? "Official Registration is Now Open"
                : "Coming Soon"}
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={itemVariants}
            transition={{ type: "spring", stiffness: 100 }}
            className="font-['Plus_Jakarta_Sans'] text-[56px] leading-[1.1] tracking-[-0.02em] font-extrabold text-on-surface max-w-xl"
          >
            Walking Together{" "}
            <span className="text-gradient">Against Cancer</span>
          </motion.h1>

          {/* Description */}
          <motion.p
            variants={itemVariants}
            transition={{ type: "spring", stiffness: 100 }}
            className="font-['Inter'] text-[18px] leading-[1.6] text-on-surface-variant max-w-lg"
          >
            {eventInfo.description}
          </motion.p>

          {/* Main CTA Buttons */}
          <motion.div
            variants={itemVariants}
            transition={{ type: "spring", stiffness: 100 }}
            className="flex flex-wrap gap-4"
          >
            <Link to="/buy-kit" className="button-primary">
              Register Today
            </Link>

            <Link to="/about" className="button-secondary">
              Learn More
            </Link>
          </motion.div>
        </motion.div>

        {/* RIGHT SIDE */}
        <motion.div
          className="flex flex-col items-center w-full"
          initial="hidden"
          animate="visible"
          variants={imageVariants}
          transition={{ type: "spring", stiffness: 50 }}
        >
          {/* Image */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl w-full max-w-[650px]">
            <motion.img
              src={heroImage}
              alt="Cancer awareness walk"
              className="w-full h-auto object-cover"
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.6 }}
            />

            {/* Countdown */}
            <motion.div
              className="absolute bottom-6 left-6 right-6 glass-card p-6 rounded-2xl shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <CountdownTimer />
            </motion.div>
          </div>

          {/* Volunteer / Influencer Buttons */}
          <motion.div
            className="flex justify-center gap-4 mt-4 max-w-[650px] mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Link to="/register-volunteer" className="button-secondary">
              Register as a Volunteer
            </Link>

            <Link to="/register-influencer" className="button-secondary">
              Register as an Influencer
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
