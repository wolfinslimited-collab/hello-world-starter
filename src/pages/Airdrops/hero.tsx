import React from "react";
import {
  Zap,
  Sparkles,
  Cat,
  Wallet,
  ArrowRight,
  LayoutDashboard,
  Layers,
  Activity,
} from "lucide-react";
import Modal from "components/specific/modal";
import { t } from "locales";
import useStorage from "context";

const HeroSection = () => {
  const {
    app: { user },
  } = useStorage();

  return (
    <div className="relative w-full overflow-hidden bg-white dark:bg-[#0a0a0a] transition-colors duration-300">
      {/* --- DYNAMIC BACKGROUND EFFECTS --- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Light Mode: Soft subtle gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-100/80 dark:bg-purple-600/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-100/80 dark:bg-cyan-500/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen" />

        {/* Tech Grid Overlay (Subtle in light, distinct in dark) */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)]" />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between px-8 py-16 lg:p-20 gap-16">
        {/* --- LEFT CONTENT: HIGH IMPACT --- */}
        <div className="flex-1 text-center lg:text-left space-y-8">
          {/* Status Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 dark:bg-white/5 border border-neutral-200 dark:border-white/10 backdrop-blur-md mx-auto lg:mx-0 shadow-sm dark:shadow-[0_0_20px_rgba(139,92,246,0.1)]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-sm font-semibold text-neutral-700 dark:text-white/90 tracking-wide">
              System Operational: Tracking 120+ Protocols
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl lg:text-7xl font-extrabold text-neutral-900 dark:text-white tracking-tight leading-[1.1]">
            The Ultimate <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 dark:from-cyan-400 dark:via-purple-400 dark:to-pink-400 animate-gradient-x">
              Airdrop Arsenal
            </span>
          </h1>

          {/* Subtext */}
          <p className="text-lg lg:text-xl text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Maximize your crypto rewards. One dashboard to track eligibility,
            claim tokens, and discover the next 100x opportunity before the
            crowd.
          </p>

          {/* CTA Section */}
          <div className="flex flex-col sm:flex-row items-center gap-5 justify-center lg:justify-start pt-4">
            <div className="flex items-center gap-6 text-sm font-medium text-neutral-500 dark:text-neutral-500">
              <div className="flex items-center gap-2 hover:text-neutral-800 dark:hover:text-neutral-300 transition-colors cursor-default">
                <Layers className="w-4 h-4" /> Deep Analysis
              </div>
              <div className="flex items-center gap-2 hover:text-neutral-800 dark:hover:text-neutral-300 transition-colors cursor-default">
                <Zap className="w-4 h-4" /> Instant Claims
              </div>
            </div>
          </div>
        </div>

        {/* --- RIGHT VISUAL: ABSTRACT DASHBOARD REPRESENTATION --- */}
        <div className="relative w-full max-w-md lg:w-[45%] perspective-[2000px] group">
          {/* Glowing Backdrop for the Card */}
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-purple-500 dark:from-cyan-500 dark:to-purple-600 rounded-[32px] blur-2xl opacity-20 dark:opacity-20 group-hover:opacity-30 transition-opacity duration-500" />

          {/* Main "Glass" Card */}
          <div className="relative bg-white/60 dark:bg-[#111]/90 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-[32px] p-6 transform rotate-y-[-12deg] rotate-x-[5deg] group-hover:rotate-y-[-5deg] group-hover:rotate-x-[0deg] transition-transform duration-500 ease-out shadow-2xl shadow-neutral-200/50 dark:shadow-black/50">
            {/* Fake UI: Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                  <Cat className="text-white w-6 h-6" />
                </div>
                <div>
                  <div className="h-2.5 w-20 bg-neutral-200 dark:bg-white/20 rounded-full mb-1.5" />
                  <div className="h-2 w-12 bg-neutral-100 dark:bg-white/10 rounded-full" />
                </div>
              </div>
              <div className="px-3 py-1 rounded-lg bg-green-100 dark:bg-green-500/20 border border-green-200 dark:border-green-500/30 text-green-600 dark:text-green-400 text-xs font-bold">
                +12 Eligible
              </div>
            </div>

            {/* Fake UI: List Items */}
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-white/5 border border-white/50 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        i === 1
                          ? "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
                          : i === 2
                          ? "bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400"
                          : "bg-pink-100 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400"
                      }`}
                    >
                      <Zap className="w-4 h-4" />
                    </div>
                    <div className="h-2 w-24 bg-neutral-200 dark:bg-white/10 rounded-full" />
                  </div>
                  <div className="h-6 w-16 bg-neutral-100 dark:bg-white/5 rounded-md" />
                </div>
              ))}
            </div>

            {/* Fake UI: Bottom Action */}
            <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-white/10 flex justify-between items-center">
              <div className="h-2 w-32 bg-neutral-200 dark:bg-white/10 rounded-full" />
              <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-white/10 flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-neutral-400 dark:text-white/50" />
              </div>
            </div>

            {/* Floating Badge */}
            <div className="absolute -top-6 -right-6 bg-white dark:bg-[#1a1a1a] border border-neutral-100 dark:border-white/10 p-4 rounded-2xl shadow-xl animate-[bounce_4s_infinite]">
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-green-500 animate-pulse" />
                <span className="text-xs font-bold text-neutral-800 dark:text-white">
                  Live Feed
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
