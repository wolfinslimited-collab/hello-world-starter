import React, { useEffect, useState } from "react";
import {
  Trophy,
  Crown,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  Loader2,
  Users,
} from "lucide-react";
import useStorage from "context";
import { get } from "utils/request";
import { truncateText } from "utils/helper";

// --- Types ---

type Period = "daily" | "weekly" | "monthly";

// Matches your API response
interface ApiLeaderboardEntry {
  rank: number;
  userId: number;
  name: string;
  wallet: string;
  score: number;
  level: number;
}

// --- Helper: Trend Icon ---
const TrendIcon = ({ type }: { type: string }) => {
  if (type === "up") return <TrendingUp size={16} className="text-green-500" />;
  if (type === "down")
    return <TrendingDown size={16} className="text-rose-500" />;
  return <Minus size={16} className="text-neutral-400" />;
};

// --- Component: Podium Item (Top 3) ---
const PodiumProfile = ({
  player,
  position,
}: {
  player: ApiLeaderboardEntry;
  position: 1 | 2 | 3;
}) => {
  // Styles based on position
  const styles = {
    1: {
      height: "h-[280px]",
      gradient: "from-yellow-300 via-amber-400 to-orange-500",
      shadow: "shadow-amber-500/20",
      border: "border-amber-200 dark:border-amber-500/30",
      badge: "bg-yellow-500",
      scale: "scale-105 z-10",
    },
    2: {
      height: "h-[240px]",
      gradient: "from-slate-200 via-slate-300 to-slate-400",
      shadow: "shadow-slate-500/20",
      border: "border-slate-200 dark:border-slate-500/30",
      badge: "bg-slate-400",
      scale: "mt-8",
    },
    3: {
      height: "h-[240px]",
      gradient: "from-orange-200 via-orange-300 to-orange-400",
      shadow: "shadow-orange-500/20",
      border: "border-orange-200 dark:border-orange-500/30",
      badge: "bg-orange-500",
      scale: "mt-8",
    },
  };

  const style = styles[position];
  const avatarUrl = `https://api.dicebear.com/7.x/identicon/svg?seed=${player.userId}`;

  return (
    <div
      className={`relative flex flex-col items-center justify-end w-1/3 min-w-[100px] ${style.scale} transition-all duration-500`}
    >
      {/* Crown for #1 */}
      {position === 1 && (
        <div className="absolute -top-8 animate-bounce">
          <Crown size={32} className="text-yellow-500 fill-yellow-500" />
        </div>
      )}

      {/* Main Card */}
      <div
        className={`w-full ${style.height} rounded-t-[30px] rounded-b-[16px] bg-gradient-to-b ${style.gradient} p-[1px] shadow-2xl ${style.shadow}`}
      >
        <div className="w-full h-full bg-white dark:bg-[#0F0F13] rounded-t-[29px] rounded-b-[15px] flex flex-col items-center justify-center p-4 relative overflow-hidden">
          {/* Background Blur Effect */}
          <div
            className={`absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b ${style.gradient} opacity-10 dark:opacity-20`}
          />

          {/* Avatar */}
          <div
            className={`relative p-1 rounded-full bg-gradient-to-br ${style.gradient} mb-3`}
          >
            <img
              src={avatarUrl}
              alt={player.name}
              className="w-16 h-16 rounded-full bg-neutral-100 border-2 border-white dark:border-[#0F0F13]"
            />
            <div
              className={`absolute -bottom-2 -right-1 size-6 rounded-full ${style.badge} flex items-center justify-center text-white font-bold text-xs border-2 border-white dark:border-[#0F0F13]`}
            >
              {position}
            </div>
          </div>

          {/* Info */}
          <div className="text-center z-10 w-full">
            <h3 className="font-bold text-neutral-900 dark:text-white truncate w-full px-2">
              {truncateText(player.name, 5, 5, 10)}
            </h3>
            <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-2">
              {player.score.toLocaleString()} TT
            </div>

            {/* Reward Pill (Mocked for now) */}
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-neutral-100 dark:bg-white/10 border border-neutral-200 dark:border-white/5 text-[10px] font-bold text-neutral-600 dark:text-neutral-300">
              <Trophy size={10} /> Lvl {player.level}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Component: Main Leaderboard ---

export default function Leaderboard() {
  const {
    memory: { leaders = null },
    setMemory,
  } = useStorage();

  const [period, setPeriod] = useState<Period>("weekly");
  const [isLoading, setIsLoading] = useState(false);

  const getLeaders = async () => {
    setIsLoading(true);
    try {
      const res: any = await get("user/leaderboards");
      if (res?.success && res?.data) {
        setMemory({ leaders: res.data.leaders });
      } else {
        // Fallback to empty structure
        setMemory({
          leaders: { daily: [], weekly: [], monthly: [] },
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch only if we don't have data in memory
    if (!leaders) {
      getLeaders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Safe Data Access
  const currentList: ApiLeaderboardEntry[] = leaders?.[period] || [];

  // Slice Data
  const firstPlace = currentList.find((p) => p.rank === 1);
  const secondPlace = currentList.find((p) => p.rank === 2);
  const thirdPlace = currentList.find((p) => p.rank === 3);
  const restList = currentList.filter((p) => p.rank > 3);

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 min-h-screen my-24">
      {/* --- Header & Controls --- */}
      <div className="space-y-6">
        <div className="flex items-center gap-4 px-2">
          <div className="p-3 rounded-2xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10">
            <Trophy
              className="text-neutral-900 dark:text-white fill-neutral-900/10"
              size={28}
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Leaderboards</h2>
            <p className="text-neutral-500 dark:text-neutral-400">
              Top players • Ranked by Coins
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-neutral-100 dark:bg-white/5 p-1 rounded-2xl border border-neutral-200 dark:border-white/5">
          {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold capitalize transition-all duration-300 ${
                period === p
                  ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm"
                  : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* --- Content Area --- */}

      {isLoading && !leaders ? (
        // Loading Skeleton
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Loader2 className="animate-spin text-blue-500" size={32} />
          <p className="text-neutral-400 text-sm">Loading rankings...</p>
        </div>
      ) : currentList.length === 0 ? (
        // Empty State
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-white/5 rounded-3xl border border-dashed border-neutral-200 dark:border-white/10">
          <div className="size-16 rounded-full bg-neutral-100 dark:bg-white/5 flex items-center justify-center mb-4">
            <Users className="text-neutral-400" size={24} />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
            No Players Yet
          </h3>
          <p className="text-neutral-500 text-sm">
            Be the first to score points this {period}!
          </p>
        </div>
      ) : (
        <>
          {/* --- The Podium (Top 3) --- */}
          {/* justify-center ensures that if we have < 3 players, they stay centered */}
          <div className="flex items-end justify-center gap-3 sm:gap-4 px-2 pb-8">
            {/* 2nd Place (Left) - Only show if exists */}
            {secondPlace ? (
              <PodiumProfile player={secondPlace} position={2} />
            ) : (
              <div className="w-1/3" />
            )}

            {/* 1st Place (Center) */}
            {firstPlace && <PodiumProfile player={firstPlace} position={1} />}

            {/* 3rd Place (Right) - Only show if exists */}
            {thirdPlace ? (
              <PodiumProfile player={thirdPlace} position={3} />
            ) : (
              <div className="w-1/3" />
            )}
          </div>

          {/* --- The Rest of the List --- */}
          <div className="space-y-3 pb-24">
            {restList.map((player) => (
              <div
                key={player.userId} // Use unique ID
                className="group flex items-center justify-between p-3 bg-white dark:bg-[#0F0F13] border border-neutral-100 dark:border-white/5 rounded-2xl hover:border-blue-200 dark:hover:border-blue-900/30 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 font-bold text-neutral-400 text-center text-sm">
                    #{player.rank}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-neutral-100 dark:bg-white/5 p-[2px]">
                      <img
                        src={`https://api.dicebear.com/7.x/identicon/svg?seed=${player.userId}`}
                        className="w-full h-full rounded-full"
                        alt="avatar"
                      />
                    </div>
                    <div>
                      <div className="font-bold text-neutral-900 dark:text-white text-sm">
                        {truncateText(player.name, 5, 5, 10)}
                      </div>
                      <div className="text-[10px] text-neutral-500 font-medium">
                        Level{" "}
                        <span className="text-blue-500">{player.level}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-neutral-900 dark:text-white text-sm">
                    {player.score.toLocaleString()}
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    {/* Since API doesn't have trend yet, we default to 'same' or logic based on data if available */}
                    <TrendIcon type="same" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* --- Sticky User Rank (Footer) --- */}
      {/* Note: To make this dynamic, you need to find the current User in the list using their ID */}
      <div className="fixed bottom-4 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[480px] z-50 hidden">
        <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-2xl border border-white/10">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold opacity-60">
                Rank
              </span>
              <span className="font-bold text-lg">--</span>
            </div>
            <div className="w-px h-8 bg-white/20 dark:bg-black/10 mx-1" />
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold text-white">
                ME
              </div>
              <div className="text-sm font-bold">
                You
                <div className="text-[10px] font-normal opacity-80">
                  Earn more to rank up!
                </div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold opacity-60">
              Reward
            </div>
            <div className="flex items-center gap-1 text-sm font-bold text-yellow-400 dark:text-yellow-600">
              <Star size={14} fill="currentColor" /> ???
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
