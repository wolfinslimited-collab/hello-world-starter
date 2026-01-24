import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Percent,
  Globe,
  Gem,
  Zap,
  Lock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Reusable NavArrow Component for cleaner code
const NavArrow: React.FC<{
  direction: "left" | "right";
  onClick: () => void;
}> = ({ direction, onClick }) => (
  <button
    onClick={onClick}
    className="group relative flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 hover:bg-neutral-50 dark:hover:bg-neutral-500/20 transition-all duration-300"
    aria-label={`${direction} slide`}
  >
    {direction === "left" ? (
      <ChevronLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300" />
    ) : (
      <ChevronRight className="w-5 h-5 text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300" />
    )}
  </button>
);

const CarouselSection: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(1);

  const carouselItems = [
    {
      title: "Lowest Fees",
      desc: "Industry leading fee structure designed for high volume traders.",
      icon: <Percent strokeWidth={1} className="size-10" />,
    },
    {
      title: "Multiple Networks",
      desc: "Offering both V1 orderbook and V2 on-chain trading across multiple chains.",
      icon: <Globe strokeWidth={1} className="size-10" />,
    },
    {
      title: "Deep Liquidity",
      desc: "Trade with minimal slippage thanks to our aggregated liquidity pools.",
      icon: <Gem strokeWidth={1} className="size-10" />,
    },
    {
      title: "100x Leverage",
      desc: "Maximize capital efficiency with up to 100x leverage on major pairs.",
      icon: <Zap strokeWidth={1} className="size-10" />,
    },
    {
      title: "Enterprise Security",
      desc: "Audited smart contracts and insurance funds to protect your assets.",
      icon: <Lock strokeWidth={1} className="size-10" />,
    },
  ];

  const nextSlide = () =>
    setActiveIndex((prev) => (prev + 1) % carouselItems.length);
  const prevSlide = () =>
    setActiveIndex(
      (prev) => (prev - 1 + carouselItems.length) % carouselItems.length
    );

  // Auto-play
  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-20 px-6 max-w-7xl mx-auto relative overflow-hidden">
      <div className="text-center mb-10">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-neutral-800 dark:text-neutral-300 tracking-tight">
          Why Timetrade?
        </h2>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
          Experience the next evolution of decentralized trading with tools
          built for pros.
        </p>
      </div>

      <div className="relative h-[400px] flex items-center justify-center">
        <AnimatePresence mode="popLayout" initial={false}>
          {carouselItems.map((item, index) => {
            // Calculate relative position with circular logic
            let offset = index - activeIndex;
            if (offset < -2) offset += carouselItems.length;
            if (offset > 2) offset -= carouselItems.length;

            // Only render relevant items for performance
            if (Math.abs(offset) > 1) return null;

            const isActive = offset === 0;

            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, scale: 0.8, x: offset * 400 }}
                animate={{
                  opacity: isActive ? 1 : 0.5,
                  scale: isActive ? 1 : 0.85,
                  x: `${offset * 105}%`,
                  zIndex: isActive ? 10 : 0,
                  filter: isActive ? "blur(0px)" : "blur(4px)",
                  rotateY: isActive ? 0 : offset * 5, // Subtle 3D rotation
                }}
                transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }} // "Apple-like" spring feel
                className="absolute w-full max-w-[380px] md:max-w-[420px]"
              >
                <div
                  className={`
                    relative h-full flex flex-col items-center text-center p-8 md:p-12 rounded-[2.5rem]
                    transition-all duration-500 border
                    ${
                      isActive
                        ? "bg-white dark:bg-black border-neutral-900/10 dark:border-neutral-200/20 shadow-xl "
                        : "bg-neutral-50 dark:bg-white/5 border-neutral-200 dark:border-white/5 shadow-none"
                    }
                  `}
                >
                  {/* Icon Container */}
                  <div className="relative w-24 h-24 mx-auto mb-8 flex items-center justify-center">
                    {/* Glow Effect */}
                    <div
                      className={`absolute inset-0 rounded-full blur-2xl transition-all duration-500 ${
                        isActive
                          ? "bg-neutral-500/20 dark:bg-neutral-500/30 scale-110"
                          : "bg-transparent scale-50"
                      }`}
                    />

                    {/* Icon Circle */}
                    <div
                      className={`relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg ${
                        isActive
                          ? "bg-black/2 dark:bg-white/5 text-rose-500"
                          : "bg-white dark:bg-white/10 text-neutral-400 dark:text-neutral-500"
                      }`}
                    >
                      {item.icon}
                    </div>
                  </div>

                  <h3
                    className={`text-2xl font-bold mb-4 transition-colors duration-300 ${
                      isActive
                        ? "text-neutral-900 dark:text-white"
                        : "text-neutral-400 dark:text-neutral-500"
                    }`}
                  >
                    {item.title}
                  </h3>

                  <p
                    className={`text-sm leading-relaxed transition-colors duration-300 ${
                      isActive
                        ? "text-neutral-600 dark:text-neutral-400"
                        : "text-neutral-400/60 dark:text-neutral-600"
                    }`}
                  >
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="flex justify-center gap-4 mt-10">
        <NavArrow direction="left" onClick={prevSlide} />
        <NavArrow direction="right" onClick={nextSlide} />
      </div>
    </section>
  );
};

export default CarouselSection;
