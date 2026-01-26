import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Plus,
  Check,
  Shield,
  Zap,
  Globe,
  Lock,
  TrendingUp,
  Rocket,
  Circle,
} from "lucide-react";

const slides = [
  {
    id: "01",
    title: "THE HUB",
    headline: "The Biggest Airdrop Hub on Earth",
    desc: "One join. Hundreds of airdrops. Zero cost.",
    icon: <Globe size={50} />,
    feature: "Universal Access",
  },
  {
    id: "02",
    title: "ZERO RISK",
    headline: "No Tokens to Buy. Ever.",
    desc: "TimeTrade is 100% free. No staking, no locking, no hidden fees.",
    icon: <Shield size={50} />,
    feature: "Protected Assets",
  },
  {
    id: "03",
    title: "ONE JOIN",
    headline: "One Sign Up. Infinite Access.",
    desc: "Unlock every ongoing and upcoming airdrop across the entire Web3 space.",
    icon: <Lock size={50} />,
    feature: "Unified Entry",
  },
  {
    id: "04",
    title: "EARN",
    headline: "Hundreds of Tokens for Free",
    desc: "Participate in verified projects and collect rewards over time, not just once.",
    icon: <Zap size={50} />,
    feature: "Continuous Rewards",
  },
  {
    id: "05",
    title: "GROW",
    headline: "Collect. Hold. Accumulate.",
    desc: "Your airdrops accumulate in one dashboard. Grow your portfolio organically.",
    icon: <TrendingUp size={50} />,
    feature: "Auto-Portfolio",
  },
  {
    id: "06",
    title: "TASKS",
    headline: "More Activity, Higher Rewards.",
    desc: "Complete simple tasks like following or testing to unlock premium tiers.",
    icon: <Plus size={50} />,
    feature: "Performance Based",
  },
  {
    id: "07",
    title: "THE EDGE",
    headline: "Why TimeTrade Wins",
    desc: "Traditional drops are scattered and manual. We are automated and unified.",
    icon: <Check size={50} />,
    feature: "Strategic Advantage",
  },
  {
    id: "08",
    title: "LAUNCH",
    headline: "Start Earning. It’s Free.",
    desc: "Join the largest airdrop ecosystem in Web3. No credit card, no tokens needed.",
    icon: <Rocket size={50} />,
    feature: "Get Started Now",
  },
];

const BetterOnboarding = () => {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const next = () => {
    setDirection(1);
    setIndex((prev) => (prev + 1) % slides.length);
  };

  const prev = () => {
    setDirection(-1);
    setIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const current = slides[index];

  return (
    <div className="h-[90vh] w-full bg-white dark:bg-black text-black dark:text-white flex flex-col md:flex-row overflow-hidden">
      {/* --- LEFT SIDE: THE CONTENT --- */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col justify-between p-8 md:p-16 border-r border-black/5 dark:border-white/10">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 font-black text-2xl tracking-tighter">
            Airdrop Hub
          </div>
        </div>

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <h2 className="text-xs font-bold tracking-[0.3em] uppercase mb-4 opacity-50">
                {current.title}
              </h2>
              <h1 className="text-5xl md:text-7xl font-bold leading-[0.9] tracking-tighter mb-8 uppercase">
                {current.headline}
              </h1>
              <p className="max-w-md text-lg md:text-xl font-medium text-neutral-500 dark:text-neutral-400">
                {current.desc}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-4 justify-between">
            <button
              onClick={prev}
              className="p-4 rounded-full border border-black/10 dark:border-white/10 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all"
            >
              <ArrowRight className="rotate-180" size={24} />
            </button>
            <button
              onClick={next}
              className="rounded-full p-4 bg-black dark:bg-white text-white dark:text-black font-bold text-lg uppercase tracking-widest hover:opacity-80 transition-all flex justify-between items-center"
            >
              <ArrowRight size={24} />
            </button>
          </div>

          {/* Progress indicators */}
          <div className="flex gap-1">
            {slides.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 transition-all duration-500 ${
                  i === index
                    ? "bg-black dark:bg-white"
                    : "bg-black/10 dark:bg-white/10"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* --- RIGHT SIDE: THE VISUAL STAGE --- */}
      <div className="w-full md:w-1/2 h-1/2 md:h-full bg-neutral-50 dark:bg-[#0a0a0a] relative flex items-center justify-center p-12">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-black dark:border-white rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-black dark:border-white rounded-full" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ scale: 0.8, opacity: 0, rotate: direction * 10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 1.1, opacity: 0, rotate: direction * -10 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-sm"
          >
            <div className="rounded-2xl aspect-square bg-white dark:bg-black border border-black/10 dark:border-white/20 p-12 flex flex-col items-center justify-center text-center shadow-[40px_40px_0px_0px_rgba(0,0,0,0.05)] dark:shadow-[40px_40px_0px_0px_rgba(255,255,255,0.02)]">
              <div className="mb-8 p-6 rounded-full border border-black/10 dark:border-white/10">
                {current.icon}
              </div>
              <div className="text-2xl font-black mb-2 uppercase tracking-tighter">
                {current.feature}
              </div>
              <div className="w-12 h-1 bg-black dark:bg-white mb-6" />
              <div className="text-xs font-mono uppercase opacity-40">
                Verified System Alpha
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BetterOnboarding;
