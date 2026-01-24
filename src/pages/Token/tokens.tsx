import { useState, useEffect, useMemo } from "react";
import useStorage from "context";
import { get } from "utils/request";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  Clock,
  Filter,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Timer,
  Zap,
  Loader2,
  Play,
} from "lucide-react";
import ClaimButton from "./claim";

// --- Types ---
interface TokenData {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  description: string;
  logoUrl: string | null;
  category: string;
  tags: string[];
  network: string;
  initialAirdrop: number;
  dailyReward: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  isFeatured: boolean;
  progress: number;
}

interface UserTokenData {
  id: number;
  tokenId: number;
  balance: number;
  lastActionAt: string;
}

// --- Helper: Calculate Time Status ---
const getTokenStatus = (start: string, end: string) => {
  const now = new Date().getTime();
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();

  if (now < startTime) {
    const diff = startTime - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return {
      status: "upcoming",
      label: `Starts in ${days}d ${hours}h`,
      color: "text-blue-500 bg-blue-50 dark:bg-blue-900/20",
    };
  } else if (now > endTime) {
    return {
      status: "expired",
      label: "Ended",
      color: "text-neutral-400 bg-neutral-100 dark:bg-neutral-800",
    };
  } else {
    return {
      status: "active",
      label: "Live",
      color: "text-green-500 bg-green-50 dark:bg-green-900/20",
    };
  }
};

export default function AirdropTable({ limit = 30 }: { limit?: number }) {
  const {
    memory: { tokens = [] },
    app: { tokens: userTokens = [] },
    setMemory,
  } = useStorage();

  const [searchParams] = useSearchParams();
  const filterType = searchParams.get("type");
  const [isLoading, setIsLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const categories = useMemo(() => {
    const cats = new Set(tokens?.map((t: TokenData) => t.category) || []);
    return ["All", ...Array.from(cats)];
  }, [tokens]);

  const filteredTokens = useMemo(() => {
    if (!tokens) return [];

    return tokens.filter((t: TokenData) => {
      const matchesSearch =
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.symbol.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || t.category === selectedCategory;
      const matchesTag = selectedTag ? t.tags.includes(selectedTag) : true;

      let matchesType = true;
      const { status } = getTokenStatus(t.startsAt, t.endsAt);
      if (filterType === "upcoming") matchesType = status === "upcoming";
      else if (filterType === "live") matchesType = status === "active";
      else if (filterType === "past") matchesType = status === "expired";

      return matchesSearch && matchesCategory && matchesTag && matchesType;
    });
  }, [tokens, search, selectedCategory, selectedTag, filterType]);

  const displayTokens = showAll
    ? filteredTokens
    : filteredTokens.slice(0, limit);

  return (
    <div className="w-full space-y-6">
      {/* --- Controls Header --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or symbol..."
            className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:text-white placeholder:text-neutral-400"
          />
        </div>

        <div className="hidden md:flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setSelectedTag(null);
              }}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-black"
                  : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {selectedCategory !== "All" && (
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <div className="flex gap-2 flex-wrap">
            {Array.from(new Set(filteredTokens.flatMap((t) => t.tags))).map(
              (tag) => (
                <button
                  key={tag}
                  onClick={() =>
                    setSelectedTag(selectedTag === tag ? null : tag)
                  }
                  className={`px-2 py-1 rounded-md border transition-colors ${
                    selectedTag === tag
                      ? "border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                      : "border-transparent bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200"
                  }`}
                >
                  #{tag}
                </button>
              )
            )}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-12 text-neutral-400 animate-pulse">
            Loading airdrops...
          </div>
        ) : displayTokens.length === 0 ? (
          <div className="text-center py-12 text-neutral-400 flex flex-col items-center">
            <AlertCircle className="size-8 mb-2 opacity-50" />
            {filterType
              ? `No ${filterType} airdrops found.`
              : "No airdrops found matching your criteria."}
          </div>
        ) : (
          displayTokens.map((token) => (
            <TokenRow key={token.id} token={token} userTokens={userTokens} />
          ))
        )}
      </div>

      {!showAll && filteredTokens.length > limit && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => setShowAll(true)}
            className="flex items-center gap-2 text-sm font-semibold text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
          >
            View all available airdrops <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

const TokenRow = ({
  token,
  userTokens,
}: {
  token: TokenData;
  userTokens: UserTokenData[];
}) => {
  const timeState = getTokenStatus(token.startsAt, token.endsAt);
  const [imgError, setImgError] = useState(false);

  const userToken = useMemo(
    () => userTokens.find((ut) => ut.tokenId === token.id),
    [userTokens, token.id]
  );

  return (
    <div className="group relative flex flex-col md:flex-row items-start md:items-center justify-between p-5 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl hover:shadow-xl hover:shadow-neutral-200/40 dark:hover:shadow-none hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-300 gap-6 md:gap-4">
      <div className="flex items-center gap-4 w-full md:w-[30%]">
        <div className="relative shrink-0">
          {token.logoUrl && !imgError ? (
            <img
              src={token.logoUrl}
              alt={token.name}
              className="size-12 rounded-full object-cover shadow-sm ring-2 ring-neutral-100 dark:ring-neutral-800"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="size-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              {token.symbol[0]}
            </div>
          )}
          {token.isFeatured && (
            <div className="absolute -top-1 -right-1 size-4 bg-yellow-400 rounded-full border-2 border-white dark:border-neutral-900 flex items-center justify-center">
              <div className="size-1.5 bg-white rounded-full animate-pulse" />
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <Link
            to={`/token/${token.slug}`}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
          >
            <h3 className="font-bold text-neutral-900 dark:text-white text-base">
              {token.name}
            </h3>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border border-neutral-200 dark:border-neutral-700">
              {token.symbol}
            </span>
          </Link>
          <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
            <span className="truncate max-w-[100px]">{token.category}</span>
            <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
            <span className="truncate max-w-[120px] text-neutral-400">
              {token.network}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full md:w-auto md:px-4">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-medium text-neutral-500 dark:text-neutral-400">
            Claimed:{" "}
            <span className="text-neutral-900 dark:text-white font-bold">
              {token.progress}%
            </span>
          </span>
          <span className="text-neutral-400">
            Reward:{" "}
            <span className="text-green-600 dark:text-green-400 font-bold">
              +{token.initialAirdrop} {token.symbol}
            </span>
          </span>
        </div>
        <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full relative"
            style={{ width: `${Math.min(token.progress, 100)}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] skew-x-12" />
          </div>
        </div>
        <div className="mt-2 flex gap-2 overflow-hidden">
          {token.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-0.5 rounded text-[10px] text-neutral-500 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-4 md:pl-4 md:border-l border-neutral-100 dark:border-neutral-800">
        <div
          className={`flex items-center gap-1.5 text-xs font-medium ${timeState.color} px-2.5 py-1 rounded-lg`}
        >
          {timeState.status === "upcoming" ? (
            <Timer size={14} />
          ) : timeState.status === "expired" ? (
            <Clock size={14} />
          ) : (
            <CheckCircle2 size={14} />
          )}
          {timeState.label}
        </div>

        <ClaimButton token={token} userToken={userToken} />
      </div>
    </div>
  );
};
