import { motion } from "framer-motion";
import { useCountdown } from "../hooks/useCountdown";

interface CountdownTimerProps {
  targetDate?: Date;
}

const EVENT_DATE = new Date("2026-08-09T07:00:00");

export function CountdownTimer({
  targetDate = EVENT_DATE,
}: CountdownTimerProps) {
  const countdown = useCountdown(targetDate);

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
  };

  const countdownItems = [
    { value: countdown.days, label: "Days" },
    { value: countdown.hours, label: "Hours" },
    { value: countdown.minutes, label: "Mins" },
    { value: countdown.seconds, label: "Secs" },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
      className="grid grid-cols-4 gap-2 md:gap-4"
    >
      {countdownItems.map((item, index) => (
        <motion.div
          key={index}
          variants={itemVariants}
          transition={{ type: "spring", stiffness: 100 }}
          className="text-center"
        >
          <motion.div
            className="font-['Plus_Jakarta_Sans'] text-[24px] leading-[1.3] font-semibold text-primary mb-1"
            key={`${item.label}-${item.value}`}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.3 }}
          >
            {String(item.value).padStart(2, "0")}
          </motion.div>
          <div className="text-[10px] md:text-xs font-['Inter'] text-[14px] leading-[1.2] tracking-[0.05em] font-semibold text-on-surface-variant uppercase tracking-wider">
            {item.label}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
