import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, MessageCircle, FileText } from "lucide-react";
import { Link } from "react-router-dom";

// --- Configuration ---
// PASTE YOUR IMAGE URL HERE
const backgroundImage = "/ok.png";

const FloatingElement = ({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) => (
  <motion.div
    className={className}
    animate={{
      y: [0, -15, 0],
      rotate: [0, 2, -2, 0],
    }}
    transition={{
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut",
      delay: delay,
    }}
  >
    {children}
  </motion.div>
);

const HeroSection: React.FC = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const y2 = useTransform(scrollY, [0, 500], [0, -150]);
  const y3 = useTransform(scrollY, [0, 500], [0, 100]); // For new button

  return (
    <section className="relative pb-32 px-6 flex flex-col items-center text-center max-w-7xl mx-auto min-h-[90vh] justify-center overflow-hidden">
      {/* --- Background Layer --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 1. Custom Background Image (If provided) */}
        {backgroundImage && (
          <div
            className="absolute inset-0 z-0 opacity-10 "
            style={{
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: "contain",
              backgroundPosition: "center",
            }}
          />
        )}
      </div>

      <motion.div
        style={{ y: y1 }}
        className="absolute top-[15%] left-[10%] hidden lg:block z-10"
      >
        <FloatingElement>
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center backdrop-blur-md transition-all
            bg-white/60 border border-gray-200 shadow-xl
            dark:bg-neutral-900/50 dark:border-white/20 dark:shadow-[0_0_30px_rgba(255,255,255,0.05)]"
          >
            <img
              src="https://cryptologos.cc/logos/ethereum-eth-logo.png?v=026"
              className="w-10 h-10 drop-shadow-md dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]"
              alt="ETH"
            />
          </div>
        </FloatingElement>
      </motion.div>

      <motion.div
        style={{ y: y2 }}
        className="absolute bottom-[20%] right-[10%] hidden lg:block z-10"
      >
        <FloatingElement delay={1}>
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center backdrop-blur-md transition-all
            bg-white/60 border border-gray-200 shadow-xl
            dark:bg-neutral-900/50 dark:border-white/20 dark:shadow-[0_0_30px_rgba(255,255,255,0.05)]"
          >
            <img
              src="https://cryptologos.cc/logos/solana-sol-logo.png?v=026"
              className="w-8 h-8 drop-shadow-md dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] "
              alt="SOL"
            />
          </div>
        </FloatingElement>
      </motion.div>

      <div className="relative z-10 max-w-5xl mt-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl text-xs font-semibold mb-10 transition-all cursor-pointer group
            border border-black/10 bg-black/5 text-black 
            dark:border-white/10 dark:bg-white/5 dark:text-white"
        >
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500 dark:bg-teal-400"></span>
          </span>
          V2 is Live: Now supporting Solana & Tron
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 leading-[1.1]"
        >
          <span
            className="bg-clip-text text-transparent bg-gradient-to-b 
            from-neutral-900 via-neutral-800 to-neutral-500
            dark:from-white dark:via-white dark:to-neutral-400 
            dark:drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]"
          >
            Next-Gen AI DEX
          </span>
          <br />
          <span
            className="text-4xl md:text-6xl font-medium
            text-neutral-500 dark:text-neutral-500"
          >
            Spot & Perpetual
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-xl max-w-2xl mx-auto mb-12 leading-relaxed
            text-neutral-600 dark:text-neutral-300"
        >
          The ultimate decentralized trading experience.{" "}
          <span
            className="font-semibold
            text-black dark:text-white dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
          >
            Up to 200x leverage
          </span>
          , zero price impact, and deep liquidity across multi-chain markets.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            to="/trade/perpetual/BTC-USDT"
            className="px-10 py-4 rounded-xl font-bold hover:scale-105 transition-transform flex items-center gap-2
              bg-neutral-900 text-white shadow-lg hover:shadow-xl
              dark:bg-white dark:text-black dark:shadow-[0_0_50px_rgba(255,255,255,0.4)]"
          >
            Get Started
            <ArrowRight size={18} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
