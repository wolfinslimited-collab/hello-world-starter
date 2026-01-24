import React, { useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Shield,
  BarChart3,
  Layers,
  Smartphone,
  Repeat,
  Network,
} from "lucide-react";

interface AdvantageCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  tag?: string;
  imageColor: string;
}

const AdvantageCard = ({
  title,
  description,
  icon,
  tag,
  imageColor,
}: AdvantageCardProps) => (
  <div
    className="group relative p-8 h-full rounded-[2rem] transition-all duration-300 overflow-hidden border
    bg-[#f3f3f3] border-black/5 hover:bg-neutral-50 
    dark:bg-[#0F0F0F] dark:border-white/10 dark:hover:bg-[#141414] "
  >
    {/* Subtle Gradient Glow */}
    <div
      className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl ${imageColor} to-transparent 
      opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-bl-full blur-2xl`}
    />

    <div className="relative z-10 h-full flex flex-col items-center text-center">
      <div className="mb-8 relative w-full h-40 flex items-center justify-center">
        {tag && (
          <div
            className="absolute top-0 right-0 px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold backdrop-blur-md shadow-lg border
            bg-white/80 text-neutral-900 border-black/5
            dark:bg-black/50 dark:text-white dark:border-white/20"
          >
            {tag}
          </div>
        )}

        <div className="relative">
          {/* Glow behind icon */}
          <div className="absolute inset-0 bg-current blur-3xl opacity-10 scale-150 dark:opacity-20 dark:text-white text-neutral-900" />
          <div
            className="w-24 h-24 rounded-3xl backdrop-blur-md flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-2xl border
            bg-white border-black/5 text-neutral-900
            dark:bg-neutral-900 dark:border-white/10 dark:text-white"
          >
            {icon}
          </div>
        </div>
      </div>

      <h3
        className="text-xl font-bold mb-4 transition-colors
        text-neutral-900 group-hover:text-indigo-600
        dark:text-white dark:group-hover:text-indigo-200"
      >
        {title}
      </h3>

      <p
        className="text-sm leading-relaxed
        text-neutral-600
        dark:text-neutral-400"
      >
        {description}
      </p>
    </div>
  </div>
);

const AdvantagesScrollSection: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400; // Adjust scroll distance as needed
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const advantages = [
    {
      title: "Freedom of Choice",
      description:
        "Dual product offering: V1 orderbook and V2 on-chain trading. Access the market's widest selection.",
      icon: <Layers size={40} className="text-blue-400" />,
      tag: "V2",
      imageColor: "from-blue-600/30",
    },
    {
      title: "Trustless Environment",
      description:
        "No third-party intermediaries, no sign-up required. Just connect your DeFi wallet and start trading.",
      icon: <Shield size={40} className="text-purple-400" />,
      tag: "DeFi",
      imageColor: "from-purple-600/30",
    },
    {
      title: "High Yield Farming",
      description:
        "Maximize your returns with the highest stablecoin LP yields available on any perpetual platform.",
      icon: <BarChart3 size={40} className="text-green-400" />,
      tag: "APR",
      imageColor: "from-green-600/30",
    },
    {
      title: "Cross-Chain Bridge",
      description:
        "Seamlessly move assets between Ethereum, Solana, and Arbitrum with our integrated secure bridge.",
      icon: <Network size={40} className="text-orange-400" />,
      tag: "Bridge",
      imageColor: "from-orange-600/30",
    },
    {
      title: "Mobile Optimized",
      description:
        "Trade on the go with our fully responsive interface designed specifically for mobile browsers.",
      icon: <Smartphone size={40} className="text-pink-400" />,
      tag: "Mobile",
      imageColor: "from-pink-600/30",
    },
    {
      title: "Recurring Orders",
      description:
        "Automate your strategy with DCA (Dollar Cost Averaging) and recurring buy/sell orders.",
      icon: <Repeat size={40} className="text-cyan-400" />,
      tag: "Auto",
      imageColor: "from-cyan-600/30",
    },
  ];

  return (
    <section className="px-6 max-w-[100vw] mb-32 overflow-hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-between mb-12">
        <h2 className="text-3xl md:text-5xl font-bold text-black dark:text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
          Advantages
        </h2>

        {/* Carousel Controls */}
        <div className="flex gap-4">
          <button
            onClick={() => scroll("left")}
            className="p-3 rounded-full border transition-all
              bg-white border-black/10 hover:bg-neutral-100 text-neutral-800
              dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 dark:text-white
              disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Scroll left"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-3 rounded-full border transition-all
              bg-white border-black/10 hover:bg-neutral-100 text-neutral-800
              dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 dark:text-white"
            aria-label="Scroll right"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      {/* Scrollable Container with Ref */}
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-12 -mx-6 px-6 md:px-0 md:mx-auto max-w-7xl scrollbar-hide"
      >
        {advantages.map((adv, i) => (
          <div key={i} className="min-w-[85vw] md:min-w-[380px] snap-center">
            <AdvantageCard {...adv} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default AdvantagesScrollSection;
