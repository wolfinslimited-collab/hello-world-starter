import React, { useState, useMemo } from "react";
import useStorage from "context";
import {
  Wallet,
  Search,
  PieChart,
  Sparkles,
  Zap,
  TrendingUp,
} from "lucide-react";
import { toMoney } from "utils/helper";
import Modal from "components/specific/modal";
import PaymentModal from "./payment";

interface TokenData {
  id: number;
  name: string;
  symbol: string;
  logoUrl: string | null;
  slug: string;
  price?: number; // Added optional price from your JSON
}

interface UserToken {
  id: number;
  balance: string | number;
  token: TokenData;
  updatedAt: string;
}

export default function PortfolioAirdrops({ mini = false }: any) {
  const {
    app: { tokens = [], user },
  } = useStorage();
  const nextLevelFee = (user?.level + 1) * 3;
  const nextBoostFee = (user?.boost + 1) * 10;

  const [searchTerm, setSearchTerm] = useState("");
  const [hideSmallBalances, setHideSmallBalances] = useState(false);
  const [showBalances, setShowBalances] = useState(true);

  // --- Logic: Process Data ---
  const processedTokens = useMemo(() => {
    return (tokens as UserToken[])
      .map((item) => {
        const balance = parseFloat(String(item.balance));
        // Use real price from object, fallback to 0 if missing
        const price = item.token.price || 0;
        const value = balance * price;

        return {
          ...item,
          balanceNum: balance,
          price: price,
          value: value,
        };
      })
      .sort((a, b) => b.value - a.value); // Sort by USD Value
  }, [tokens]);

  // --- Filter Logic ---
  const filteredTokens = processedTokens.filter((t) => {
    const matchesSearch =
      t.token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.token.symbol.toLowerCase().includes(searchTerm.toLowerCase());

    // Hide dust (< $0.01 value)
    const isNotDust = hideSmallBalances ? t.value > 0.01 : true;

    return matchesSearch && isNotDust;
  });

  // --- Totals ---
  const totalValue = processedTokens.reduce((acc, curr) => acc + curr.value, 0);
  if (user?.status === "Pending") return null;
  return (
    <div
      className={
        "max-w-4xl mx-auto px-4 md:px-0 space-y-8 " + (mini ? "" : "pb-24 pt-6")
      }
    >
      <div className="relative overflow-hidden rounded-3xl bg-neutral-100 dark:bg-neutral-900 p-6 text-black dark:text-white md:p-8">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-black/10 dark:bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-black/10 dark:bg-white/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          {/* --- Total Value --- */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-400">
              <Wallet className="size-4" /> Total Asset Value
            </div>
            <div className="text-4xl font-bold tracking-tighter md:text-5xl">
              $
              {totalValue.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </div>
          </div>

          {/* --- Actions --- */}
          <div className="flex items-center gap-3">
            {/* --- BOOST --- */}
            <Modal
              trigger={
                <button className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-black to-neutral-700 dark:from-white dark:to-neutral-400 px-4 py-2 font-bold text-white dark:text-black transition-all hover:scale-105 active:scale-95">
                  <TrendingUp size={16} className="" />
                  <span className="text-sm">
                    Lvl Up{" "}
                    <span className="opacity-70">(${nextLevelFee || 0})</span>
                  </span>
                </button>
              }
            >
              <PaymentModal type={"UPGRADE"} cost={nextLevelFee || 0} />
            </Modal>

            {/* BOOST BUTTON */}
            <Modal
              trigger={
                <button className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-black to-neutral-700 dark:from-white dark:to-neutral-400 px-4 py-2 font-bold text-white dark:text-black transition-all hover:scale-105 active:scale-95">
                  <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
                  <Zap size={16} className="" />
                  <span className="text-sm">
                    Boost{" "}
                    <span className="opacity-70">(${nextBoostFee || 0})</span>
                  </span>
                </button>
              }
            >
              <PaymentModal type={"BOOST"} cost={nextBoostFee || 0} />
            </Modal>
          </div>
        </div>
      </div>

      {/* --- 2. Filters & Search --- */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 sticky top-4 z-20">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          <div className="p-3 rounded-2xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10">
            <PieChart
              className="text-neutral-900 dark:text-white fill-neutral-900/10"
              size={28}
            />
          </div>
          <span>Your Tokens</span>
        </h2>

        <div className="flex items-center gap-3 w-full md:w-auto bg-white/80 dark:bg-[#0F0F13]/80 backdrop-blur-xl p-1.5 rounded-2xl border border-neutral-200 dark:border-white/10 shadow-sm">
          {/* Search Input */}
          <div className="relative flex-1 md:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-transparent text-sm outline-none text-neutral-900 dark:text-white placeholder:text-neutral-400"
            />
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-neutral-200 dark:bg-white/10" />

          {/* Hide Dust Toggle */}
          <button
            onClick={() => setHideSmallBalances(!hideSmallBalances)}
            className={`p-2 rounded-xl transition-all ${
              hideSmallBalances
                ? "bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
                : "text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
            }`}
            title={
              hideSmallBalances
                ? "Show all balances"
                : "Hide small balances (<$0.01)"
            }
          >
            <Sparkles size={18} />
          </button>
        </div>
      </div>

      {/* --- 3. Premium Token List --- */}
      <div className="space-y-3">
        {filteredTokens.length > 0 ? (
          filteredTokens.map((item) => (
            <div
              key={item.id}
              className="group flex items-center justify-between p-4 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800  rounded-2xl  transition-all duration-300 cursor-default"
            >
              {/* Left: Token Identity */}
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  {item.token.logoUrl ? (
                    <img
                      src={item.token.logoUrl}
                      alt={item.token.name}
                      className="size-12 rounded-full object-cover bg-white dark:bg-neutral-800 shadow-sm ring-1 ring-neutral-100 dark:ring-white/5"
                    />
                  ) : (
                    <div className="size-12 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-white/5 dark:to-white/10 flex items-center justify-center text-neutral-600 dark:text-white font-bold text-lg ring-1 ring-neutral-100 dark:ring-white/5">
                      {item.token.symbol[0]}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-neutral-900 dark:text-white text-base  transition-colors">
                      {item.token.name}
                    </h3>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-neutral-100 dark:bg-white/10 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-white/5">
                      {item.token.symbol}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-neutral-400 mt-1 flex items-center gap-1">
                    Price:{" "}
                    <span className="text-neutral-600 dark:text-neutral-300">
                      ${item.price.toFixed(6)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Financials */}
              <div className="text-right">
                <div className="font-bold text-neutral-900 dark:text-white text-lg tracking-tight">
                  {showBalances ? toMoney(item.balanceNum) : "•••"}{" "}
                  {item.token.symbol}
                </div>
                <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {showBalances ? `$${toMoney(item.value)}` : "••••"}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-neutral-50/50 dark:bg-white/[0.02] rounded-3xl border-2 border-dashed border-neutral-200 dark:border-white/10">
            <div className="size-16 bg-white dark:bg-white/5 rounded-2xl flex items-center justify-center mb-4 text-neutral-400 shadow-sm">
              <Search size={32} />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
              No tokens found
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto mt-1 leading-relaxed">
              {searchTerm
                ? "We couldn't find any tokens matching your search."
                : "Your portfolio is empty. Start completing missions to earn airdrops!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
