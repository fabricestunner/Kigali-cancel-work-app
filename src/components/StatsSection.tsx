import { motion } from "framer-motion";
import { Users, Heart , Smile } from "lucide-react";
import { stats } from "../data";

export function StatsSection() {
  const statCards = [
    {
      icon: Users,
      value: stats.participants,
      label: "Participants to  Join",
      color: "primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Heart,
      value: stats.fundsRaised,
      label: "Partners ",
      color: "secondary",
      bgColor: "bg-secondary/10",
      hasProgress: true,
    },
  
    {
      icon: Smile,
      value: stats.survivorsWalking,
      label: "Survivors Walking",
      color: "primary",
      bgColor: "bg-primary-fixed-dim/30",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section className="bg-surface-container-low py-stack-lg">
      <div className="max-w-container-max mx-auto px-gutter">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                transition={{ type: "spring", stiffness: 100 }}
                className="bg-surface p-8 rounded-3xl shadow-sm border border-outline-variant/30 hover:shadow-md transition-shadow group"
              >
                <div
                  className={`w-14 h-14 rounded-2xl ${card.bgColor} flex items-center justify-center text-${card.color} mb-6 group-hover:bg-${card.color} group-hover:text-white transition-colors`}
                >
                  <Icon className="w-8 h-8" />
                </div>
                <motion.div
                  className="font-['Plus_Jakarta_Sans'] text-[40px] leading-[1.2] font-bold text-on-surface mb-1"
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, type: "spring" }}
                >
                  {card.value}
                </motion.div>
                <div className="font-['Inter'] text-[14px] leading-[1.2] tracking-[0.05em] font-semibold text-on-surface-variant">
                  {card.label}
                </div>
                {card.hasProgress && (
                  <motion.div
                    className="mt-4 bg-outline-variant/20 h-2 w-full rounded-full overflow-hidden"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                  >
                    <motion.div
                      className="gradient-primary h-full w-[85%] rounded-full"
                      initial={{ width: 0 }}
                      whileInView={{ width: "85%" }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3, duration: 1 }}
                    ></motion.div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
