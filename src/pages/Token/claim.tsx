import { useState, useEffect, type MouseEvent } from "react";
import {
  Timer,
  Clock,
  Zap,
  Loader2,
  Play,
  Wallet,
  Crown,
  Check,
} from "lucide-react";
import { usePost } from "hooks/use-query";
import useStorage from "context";
import confetti from "canvas-confetti";
import OnboardingModal from "pages/Airdrops/onboarding";

import { createPortal } from "react-dom";
import { toast } from "react-toastify";

interface UserTokenData {
  id: number;
  tokenId: number;
  balance: number;
  lastActionAt: string;
}

interface ClaimButtonProps {
  token: any;
  userToken?: UserTokenData;
  variant?: "compact" | "full";
  onClaimSuccess?: () => void;
}

// --- Helper: Status Check ---
const getStatus = (start: string, end: string) => {
  const now = new Date().getTime();
  if (now < new Date(start).getTime()) return "upcoming";
  if (now > new Date(end).getTime()) return "expired";
  return "active";
};

export default function ClaimButton({
  token,
  userToken,
  variant = "compact",
  onClaimSuccess,
}: ClaimButtonProps) {
  const {
    setApp,
    app: { tokens = [], user },
    setting: { isLoged },
  } = useStorage();

  // Support both snake_case (API) and camelCase property names
  const [status] = useState(getStatus(token.starts_at || token.startsAt, token.ends_at || token.endsAt));
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [canClaim, setCanClaim] = useState(false);

  // States for UI handling
  const [isLoading, setIsLoading] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Success Animation States
  const [showSuccess, setShowSuccess] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(0);

  const { sendData } = usePost({ auth: true });

  // --- Timer Logic ---
  useEffect(() => {
    if (status !== "active" || !userToken) return;

    const calculateTime = () => {
      const lastAction = new Date(userToken.lastActionAt).getTime();
      const now = new Date().getTime();
      const cooldown = 24 * 60 * 60 * 1000; // 24 hours
      const nextClaim = lastAction + cooldown;
      const diff = nextClaim - now;

      if (diff <= 0) {
        setCanClaim(true);
        setTimeLeft(null);
      } else {
        setCanClaim(false);
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        setTimeLeft(
          variant === "full"
            ? `${hours.toString().padStart(2, "0")}:${minutes
                .toString()
                .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
            : `${hours}h ${minutes}m`
        );
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [userToken, status, variant]);

  // --- Actions ---

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#6366f1", "#10b981", "#ec4899"],
    });
  };

  const handleClaim = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);

    sendData("tokens/claim", { tokenId: token.id }, (res: any) => {
      setIsLoading(false);

      if (res?.success) {
        const { userToken: updatedUserToken, rewardClaimed } = res.data;

        // 1. Trigger Success UI
        setRewardAmount(rewardClaimed);
        setShowSuccess(true);
        triggerConfetti();

        // 2. Update Global State
        const currentTokens = [...tokens];
        const index = currentTokens.findIndex(
          (t: UserTokenData) => t.tokenId === token.id
        );

        if (index > -1) {
          currentTokens[index] = updatedUserToken;
        } else {
          currentTokens.push(updatedUserToken);
        }
        setApp({ tokens: currentTokens });

        if (onClaimSuccess) onClaimSuccess();

        setTimeout(() => {
          setShowSuccess(false);
          setCanClaim(false);
        }, 2500);
      } else {
        toast.error(res?.message);
      }
    });
  };

  const handleActivatePlan = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOnboardingOpen(true);
  };

  const isFull = variant === "full";
  const baseClasses = isFull
    ? "w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300"
    : "w-[100px] py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-300 shadow-sm";

  if (showSuccess) {
    return (
      <RewardPopup
        amount={rewardAmount}
        symbol={token.symbol}
        logo={token.logo_url || token.logoUrl}
      />
    );
  }

  if (isLoading) {
    return (
      <button
        disabled
        className={`${baseClasses} !w-auto px-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 opacity-80 cursor-wait`}
      >
        <Loader2 className={`${isFull ? "size-5" : "size-4"} animate-spin`} />
      </button>
    );
  }

  if (!isLoged) {
    return null;
  }

  // 4. Pending Status -> Activate Plan
  if (user?.status === "Pending") {
    return (
      <>
        <button
          onClick={handleActivatePlan}
          className={`${baseClasses} bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-orange-500/20 hover:scale-[1.02]`}
        >
          <Crown size={isFull ? 16 : 14} className="fill-white/20" />
          {isFull ? "Activate Plan" : "Activate"}
        </button>

        {/* Modal Portal */}
        <OnboardingModal
          isOpen={isOnboardingOpen}
          onClose={() => setIsOnboardingOpen(false)}
        />
      </>
    );
  }

  // 5. Inactive (Upcoming/Expired)
  if (status !== "active") {
    return (
      <button
        disabled
        className={`${baseClasses} bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border border-neutral-200 dark:border-neutral-700 cursor-not-allowed`}
      >
        {status === "upcoming" ? (
          <Timer size={isFull ? 16 : 14} />
        ) : (
          <Clock size={isFull ? 16 : 14} />
        )}
        {status === "upcoming" ? "Wait" : "Ended"}
      </button>
    );
  }

  // 6. Start (First Time Interaction)
  if (!userToken) {
    return (
      <button
        onClick={handleClaim}
        className={`${baseClasses} bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:scale-[1.02] shadow-lg`}
      >
        <Play size={isFull ? 16 : 14} className="fill-current" /> Start
      </button>
    );
  }

  // 7. Claim Now
  if (canClaim) {
    return (
      <button
        onClick={handleClaim}
        className={`${baseClasses} group bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-500/30`}
      >
        <Zap
          size={isFull ? 16 : 14}
          className="fill-white group-hover:animate-pulse"
        />
        Claim
      </button>
    );
  }

  // 8. Cooldown Timer
  return (
    <button
      disabled
      className={`${baseClasses} bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 border border-neutral-200 dark:border-neutral-700 cursor-not-allowed`}
    >
      <Timer size={isFull ? 16 : 12} /> {timeLeft || "..."}
    </button>
  );
}

const RewardPopup = ({
  amount,
  symbol,
  logo,
}: {
  amount: number;
  symbol: string;
  logo: string | null;
}) => {
  // Use Portal to break out of Table/Overflow containers
  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center pointer-events-none">
      {/* Backdrop (Optional: subtle dim) */}

      {/* The Card */}
      <div className="relative animate-fade-up bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-2xl rounded-3xl p-8 flex flex-col items-center gap-4 min-w-[280px] animate-in zoom-in-50 slide-in-from-bottom-10 duration-500 ease-out">
        {/* Glow Effect behind icon */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full" />

        {/* Icon */}
        <div className="relative size-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-[3px] shadow-lg shadow-indigo-500/30">
          <div className="w-full h-full bg-white dark:bg-neutral-900 rounded-full flex items-center justify-center overflow-hidden">
            {logo ? (
              <img src={logo} alt={symbol} className="size-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-indigo-600">
                {symbol[0]}
              </span>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-1.5 rounded-full border-4 border-white dark:border-neutral-900">
            <Check size={16} strokeWidth={4} />
          </div>
        </div>

        {/* Text */}
        <div className="text-center space-y-1 relative z-10">
          <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">
            Claim Successful
          </h3>
          <div className="text-4xl font-black text-neutral-900 dark:text-white tracking-tight">
            +{amount}
          </div>
          <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
            {symbol}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
