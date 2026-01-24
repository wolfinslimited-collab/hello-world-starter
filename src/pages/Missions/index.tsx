import { useState, useMemo, useEffect } from "react";
import {
  Check,
  Lock,
  Download,
  Rocket,
  Gift,
  Hexagon,
  Loader2,
  Wallet,
} from "lucide-react";
import useStorage from "context";
import { get } from "utils/request";
import { usePost } from "hooks/use-query";
import { toMoney } from "utils/helper";
import { createPortal } from "react-dom";
import confetti from "canvas-confetti";

export interface Mission {
  id: number; // Int in Prisma
  title: string;
  description: string | null;
  provider: string;
  rewardAmount: number;
  actionUrl?: string;
  logo?: string;
  tags: string[];
  isActive: boolean;
  // Computed property for frontend
  initialStatus: "locked" | "active" | "completed";
}

export interface UserMission {
  id: number;
  userId: number;
  missionId: number;
  reward?: number;
  createdAt: string; // DateTime
}
interface TokenData {
  id: number;
  name: string;
  symbol: string;
  logoUrl?: string;
  price?: number;
  amount: number;
}

const getProviderStyle = (provider: string) => {
  const p = provider.toLowerCase();
  if (p.includes("twitter") || p.includes("x")) {
    return {
      bg: "bg-sky-500",
      border: "border-sky-500/20",
      text: "text-sky-500",
      icon: "𝕏",
    };
  }
  if (p.includes("discord")) {
    return {
      bg: "bg-indigo-500",
      border: "border-indigo-500/20",
      text: "text-indigo-500",
      icon: "👾",
    };
  }
  if (p.includes("telegram")) {
    return {
      bg: "bg-blue-400",
      border: "border-blue-400/20",
      text: "text-blue-400",
      icon: "✈️",
    };
  }
  if (p.includes("download")) {
    return {
      bg: "bg-emerald-500",
      border: "border-emerald-500/20",
      text: "text-emerald-500",
      icon: <Download size={20} className="relative z-10" />,
    };
  }
  // Default / Referral
  return {
    bg: "bg-purple-500",
    border: "border-purple-500/20",
    text: "text-purple-500",
    icon: "🎁",
  };
};
const RewardModal = ({
  isOpen,
  onClose,
  tokens,
}: {
  isOpen: boolean;
  onClose: () => void;
  tokens: TokenData[];
}) => {
  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* Backdrop */}

      {/* Modal Content */}
      <div className="relative animate-fade-up w-full max-w-sm bg-white dark:bg-[#0F0F13] border border-neutral-100 dark:border-white/10 shadow-2xl rounded-[32px] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-300">
        {/* Header Section */}
        <div className="relative p-6 pb-2 text-center overflow-hidden">
          {/* Background Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-green-500/20 blur-[60px] pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-500/10 flex items-center justify-center ring-8 ring-green-50 dark:ring-green-500/5 mb-2">
              <Gift size={32} className="text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-black text-neutral-900 dark:text-white">
              Mission Complete!
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              You've successfully claimed your rewards.
            </p>
          </div>
        </div>

        {/* Token List (The requested design) */}
        <div className="p-4 bg-neutral-50/50 dark:bg-white/[0.02]">
          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1 scrollbar-hide">
            {tokens.map((userToken: any, index: number) => {
              // Extract Data
              const info = userToken.token || userToken; // Handle different API structures
              const balance = parseFloat(
                userToken.balance || userToken.amount || 0
              );
              const price = info.price || 0;
              const valueUSD = balance * price;

              return (
                <div
                  key={index}
                  className="group flex items-center justify-between p-3 bg-white dark:bg-[#1A1A1E] border border-neutral-100 dark:border-white/5 rounded-2xl shadow-sm hover:border-green-500/30 transition-all"
                >
                  {/* Left: Identity */}
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      {info.logoUrl ? (
                        <img
                          src={info.logoUrl}
                          alt={info.symbol}
                          className="size-10 rounded-full object-cover bg-neutral-100 dark:bg-neutral-700 border border-neutral-100 dark:border-white/5"
                        />
                      ) : (
                        <div className="size-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-1 ring-white/10">
                          {info.symbol?.[0] || "?"}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <div className="font-bold text-neutral-900 dark:text-white text-sm">
                          {info.name}
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-neutral-100 dark:bg-white/10 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-white/5">
                          {info.symbol}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1">
                        Price:{" "}
                        <span className="text-neutral-600 dark:text-neutral-300">
                          ${price.toFixed(6)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Financials */}
                  <div className="text-right">
                    <div className="font-bold text-neutral-900 dark:text-white text-sm tracking-tight">
                      +{toMoney(balance)} {info.symbol}
                    </div>
                    <div className="text-xs font-medium text-green-600 dark:text-green-400 mt-0.5">
                      ${toMoney(valueUSD)}
                    </div>
                  </div>
                </div>
              );
            })}

            {tokens.length === 0 && (
              <div className="p-8 text-center text-neutral-500 text-sm border border-dashed border-neutral-200 dark:border-white/10 rounded-xl">
                <Wallet className="mx-auto mb-2 opacity-50" size={20} />
                Rewards added to wallet
              </div>
            )}
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-4 pt-2">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-xl font-bold text-sm bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
          >
            Awesome, thanks!
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export const MissionCard = ({ mission }: { mission: Mission }) => {
  const {
    setting: { isLoged },
    memory: { tokens = [] },
    setMemory,
  } = useStorage();

  const { sendData } = usePost({ auth: true });

  // Local State
  const [status, setStatus] = useState<string>("active");
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    if (mission?.initialStatus) {
      setStatus(mission.initialStatus);
    }
  }, [mission?.initialStatus]);
  // Popup States
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [earnedTokens, setEarnedTokens] = useState<TokenData[]>([]);

  const style = getProviderStyle(mission.provider);

  // Memoize random tokens for visual flair (small icons in the card)
  const rewardIcons = useMemo(() => {
    return [...tokens].sort(() => 0.5 - Math.random()).slice(0, 3);
  }, [tokens]);

  // --- Confetti Animation ---
  const triggerConfetti = () => {
    const end = Date.now() + 1000;
    const colors = ["#10b981", "#3b82f6", "#f59e0b"];

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  };

  // --- Handlers ---
  const handleAction = () => {
    if (status === "active") {
      setIsLoading(true);
      window.open(mission.actionUrl || "#", "_blank");

      // Simulating verification delay
      setTimeout(() => {
        setIsLoading(false);
        setStatus("claimable");
      }, 1500);
    } else if (status === "claimable") {
      setIsLoading(true);

      sendData("missions/claim", { missionId: mission.id }, (res: any) => {
        setIsLoading(false);
        if (res?.success) {
          const { userMissions, tokens: _tokens } = res.data;

          // 1. Update Global State
          setMemory({ userMissions: userMissions || [] });

          // 2. Set Local Reward Data & Show Popup
          setEarnedTokens(_tokens || []); // Assuming _tokens is the array of received items
          setStatus("completed");
          setShowRewardModal(true);

          // 3. Trigger Animation
          triggerConfetti();
        }
      });
    }
  };

  const isCompleted = status === "completed";
  const isLocked = status === "locked";
  const isClaimable = status === "claimable";

  return (
    <>
      {/* --- Reward Modal Portal --- */}
      <RewardModal
        isOpen={showRewardModal}
        onClose={() => setShowRewardModal(false)}
        tokens={earnedTokens}
      />

      {/* --- Card UI --- */}
      <div
        className={`group relative w-full rounded-[24px] p-[1px] transition-all duration-500 ${
          isCompleted
            ? "opacity-60 grayscale-[0.5]"
            : "hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/5"
        }`}
      >
        <div
          className={`absolute inset-0 rounded-[24px] bg-gradient-to-r from-transparent via-neutral-200 dark:via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700`}
        />

        <div className="relative flex flex-col md:flex-row items-center gap-5 p-5 rounded-[23px] bg-white dark:bg-[#0F0F13] border border-neutral-100 dark:border-white/5 overflow-hidden">
          {/* Ambient Glow */}
          <div
            className={`absolute -left-10 -top-10 w-40 h-40 ${style.bg} rounded-full blur-[100px] opacity-[0.10] group-hover:opacity-[0.20] transition-opacity duration-500 pointer-events-none`}
          />

          {/* --- Left Section: Icon --- */}
          <div className="relative shrink-0 z-10">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl bg-neutral-50 dark:bg-white/5 border border-neutral-100 dark:border-white/10 shadow-sm group-hover:scale-110 transition-transform duration-500">
              <span className="relative z-10">
                {mission.logo ? (
                  <img
                    src={mission.logo}
                    className="size-full p-2 rounded-2xl object-contain"
                    alt="logo"
                  />
                ) : (
                  <span className="text-4xl">{style.icon}</span>
                )}
              </span>
              <div
                className={`absolute w-8 h-8 ${style.bg} blur-xl opacity-40`}
              />

              {isCompleted && (
                <div className="absolute -right-2 -bottom-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-[#0F0F13]">
                  <Check size={12} className="text-white stroke-[4]" />
                </div>
              )}
              {isLocked && (
                <div className="absolute -right-2 -bottom-2 w-6 h-6 bg-neutral-500 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-[#0F0F13]">
                  <Lock size={12} className="text-white" />
                </div>
              )}
            </div>
          </div>

          {/* --- Middle Section: Info --- */}
          <div className="flex-1 text-center md:text-left z-10 min-w-0">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
              {mission.tags &&
                mission.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-neutral-100 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-white/5"
                  >
                    {tag}
                  </span>
                ))}
            </div>
            <h3
              className={`text-lg font-bold tracking-tight mb-1 truncate w-full ${
                isCompleted
                  ? "text-neutral-400 line-through"
                  : "text-neutral-900 dark:text-white"
              }`}
            >
              {mission.title}
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed line-clamp-2">
              {mission.description || "Complete this task to earn rewards."}
            </p>
          </div>

          {/* --- Right Section: Reward & Action --- */}
          <div className="flex flex-col items-center md:items-end gap-4 z-10 min-w-[150px]">
            <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-neutral-50 dark:bg-white/5 border border-neutral-100 dark:border-white/5">
              <span className="font-bold text-neutral-900 dark:text-neutral-100">
                {mission.rewardAmount}
              </span>
              {tokens.length > 0 && (
                <div className="flex -space-x-2 overflow-hidden py-0.5 pl-0.5">
                  {rewardIcons.map((token: any, i: number) => (
                    <img
                      key={token.id || i}
                      className="inline-block h-5 w-5 rounded-full ring-2 ring-white dark:ring-[#1A1A1E] bg-white object-cover"
                      src={token.logoUrl}
                      alt={token.symbol}
                    />
                  ))}
                </div>
              )}
              <span className="text-sm text-neutral-700 dark:text-neutral-200">
                +{tokens.length} Tokens
              </span>
            </div>

            {!isLoged ? null : (
              <>
                {isCompleted ? (
                  <button
                    // Optional: Allow clicking completed mission to see receipt again
                    onClick={() => setShowRewardModal(true)}
                    className="h-10 px-8 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 hover:bg-green-100 dark:hover:bg-green-500/20 transition-colors"
                  >
                    Completed
                  </button>
                ) : isLocked ? (
                  <div className="h-10 px-8 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-neutral-400 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-white/5">
                    <Lock size={14} /> Locked
                  </div>
                ) : isClaimable ? (
                  <button
                    onClick={handleAction}
                    disabled={isLoading}
                    className="group/btn relative h-10 px-6  md:w-auto rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500" />
                    <div className="absolute inset-0 rounded-xl bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />

                    <div className="relative flex items-center gap-2">
                      {isLoading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />{" "}
                        </>
                      ) : (
                        <>
                          <Gift size={16} className="animate-bounce" />
                          <span>Claim Reward</span>
                        </>
                      )}
                    </div>
                  </button>
                ) : (
                  <button
                    onClick={handleAction}
                    disabled={isLoading}
                    className="group/btn relative h-10 px-6 md:w-auto rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white shadow-lg transition-all hover:w-full md:hover:w-auto hover:px-8"
                  >
                    <div className="absolute inset-0 rounded-xl bg-neutral-900 dark:bg-white dark:text-black border border-transparent dark:border-white/20" />
                    <span className="relative z-10 flex items-center gap-2 dark:text-black">
                      {isLoading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />{" "}
                        </>
                      ) : (
                        <>
                          Start Mission
                          <Rocket
                            size={14}
                            className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform"
                          />
                        </>
                      )}
                    </span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default function MissionBoard() {
  const {
    setting: { isLoged, token },
    memory: { missions = null, userMissions = [] },
    setMemory,
  } = useStorage();

  const fetchMissions = () => {
    // Fetch all missions
    get("missions").then((res: any) => {
      if (res?.success) {
        setMemory({ missions: res.data.missions || [] });
      } else {
        setMemory({ missions: [] }); // Empty array on failure to stop loading state
      }
    });

    // Fetch user progress if logged in
    if (isLoged) {
      get("missions/user", { token }).then((res: any) => {
        if (res?.success) {
          setMemory({ userMissions: res.data.userMissions || [] });
        }
      });
    }
  };

  useEffect(() => {
    if (missions === null) {
      fetchMissions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoged]);

  const displayMissions = useMemo(() => {
    if (!missions) return null; // Still loading
    return missions
      .filter((m: Mission) => m.isActive)
      .map((mission: Mission): Mission => {
        const isCompleted = userMissions.some(
          (um: UserMission) => Number(um.missionId) === Number(mission.id)
        );
        return {
          ...mission,
          initialStatus: isCompleted ? "completed" : "active",
        };
      });
  }, [missions, userMissions]);

  const isLoading = displayMissions === null;
  const isEmpty = displayMissions && displayMissions.length === 0;
  return (
    <div className="max-w-5xl py-8 mx-auto px-6 space-y-8 min-h-screen  bg-white dark:bg-black text-neutral-900 dark:text-white">
      {/* Header Section */}
      <div className="flex items-center gap-4 px-2">
        <div className="p-3 rounded-2xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10">
          <Hexagon
            className="text-neutral-900 dark:text-white fill-neutral-900/10"
            size={28}
          />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Mission Center</h2>
          <p className="text-neutral-500 dark:text-neutral-400">
            Complete tasks • Earn Coins
          </p>
        </div>
      </div>

      {/* List Content */}
      <div className="space-y-4">
        {isLoading && (
          <>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-full h-32 rounded-[24px] bg-neutral-100 dark:bg-white/5 animate-pulse"
              />
            ))}
          </>
        )}

        {!isLoading && isEmpty && (
          // Empty State
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-neutral-200 dark:border-white/10 rounded-[24px]">
            <div className="w-16 h-16 bg-neutral-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
              <Gift className="text-neutral-400" size={24} />
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
              No Missions Available
            </h3>
            <p className="text-neutral-500 text-sm mt-1">
              Check back later for new tasks.
            </p>
          </div>
        )}

        {!isLoading &&
          displayMissions &&
          displayMissions.map((m: Mission) => (
            <MissionCard key={m.id} mission={m} />
          ))}
      </div>
    </div>
  );
}
