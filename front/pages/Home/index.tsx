import React from "react";
import { motion } from "framer-motion";
import { Wallet, BarChart3, Globe } from "lucide-react";
import HeroSection from "./hero";
import AdvantagesSection from "./advantage";
import CarouselSection from "./carousel";

const TimetradeLanding: React.FC = () => {
  return (
    <div className="min-h-screen text-white font-sans overflow-x-hidden">
      <main className="relative z-10">
        <HeroSection />
        <StatsSection />
        <AdvantagesSection />
        <CarouselSection />
        <PartnersMarqueeSection />
      </main>
    </div>
  );
};

const StatsSection: React.FC = () => {
  const stats = [
    {
      label: "Total Volume",
      value: "$4.5B+",
      icon: <BarChart3 strokeWidth={1} className="size-12" />,
    },
    {
      label: "Total Users",
      value: "50K+",
      icon: <Globe strokeWidth={1} className="size-12" />,
    },
    {
      label: "Open Interest",
      value: "$28M",
      icon: <Wallet strokeWidth={1} className="size-12" />,
    },
  ];

  return (
    <section className="relative z-20 max-w-6xl mx-auto px-6 -mt-20 mb-32">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            viewport={{ once: true }}
            className="group flex gap-8 relative p-8 h-full rounded-[2rem] transition-all duration-300 overflow-hidden border bg-[#f3f3f3] border-black/5 hover:bg-neutral-50 dark:bg-[#0F0F0F] dark:border-white/10 dark:hover:bg-[#141414]"
          >
            <div
              className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-black/10 dark:from-white/10 to-transparent  rounded-bl-full blur-2xl`}
            />
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-neutral-500 dark:text-neutral-400 transition-all duration-300 group-hover:scale-110">
              {stat.icon}
            </div>
            <div>
              <p className="text-neutral-500 text-sm font-bold uppercase tracking-wider mb-1 transition-colors">
                {stat.label}
              </p>
              <h3 className="text-3xl font-bold  text-black dark:text-white transition-colors">
                {stat.value}
              </h3>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

const PartnersMarqueeSection: React.FC = () => {
  const partners = [
    "BINANCE",
    "COINBASE",
    "KRAKEN",
    "ARBITRUM",
    "OPTIMISM",
    "SOLANA",
    "POLYGON",
    "AVALANCHE",
    "CHAINLINK",
    "UNISWAP",
  ];

  return (
    <section className="w-full mb-40 pt-20 overflow-hidden relative ">
      {/* Side fades for infinite effect - Adapted for Light/Dark */}
      <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-white via-white/80 to-transparent dark:from-black dark:via-black/80 dark:to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-white via-white/80 to-transparent dark:from-black dark:via-black/80 dark:to-transparent z-10 pointer-events-none" />

      <p className="text-center text-sm font-bold text-slate-500 dark:text-neutral-500 mb-12 uppercase tracking-[0.3em]">
        Trusted by Industry Leaders
      </p>

      {/* Marquee Container */}
      <div className="flex w-full select-none">
        <motion.div
          className="flex gap-16 md:gap-32 whitespace-nowrap pr-16 md:pr-32"
          animate={{ x: "-50%" }}
          transition={{
            duration: 100,
            ease: "linear",
            repeat: Infinity,
          }}
        >
          {/* Triple list to ensure smooth looping on ultra-wide screens */}
          {[...partners, ...partners, ...partners].map((name, i) => (
            <PartnerLogo key={i} name={name} />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const PartnerLogo = ({ name }: { name: string }) => (
  <div className="flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity duration-300 cursor-pointer">
    {/* Replace this div with your actual SVG Logo */}
    <span className="text-2xl font-bold text-slate-900 dark:text-white">
      {name}
    </span>
  </div>
);

export default TimetradeLanding;
