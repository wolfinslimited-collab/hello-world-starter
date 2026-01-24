import React, { useState, useEffect } from "react";
import {
  Zap,
  Sparkles,
  ShieldCheck,
  Users,
  Share2,
  X,
  Gamepad2,
  ArrowRight,
  Wallet,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { toast } from "react-toastify";
import { usePost, useWallet } from "hooks/use-query";
import useStorage from "context"; // Assuming this exports your context hook
// import { useWallet } from "hooks/use-wallet"; // Import this if you need to fetch fresh data
import { useNavigate } from "react-router-dom";
import { toMoney } from "utils/helper";

const AMOUNT = 3; // Cost in USD

// Interface based on your JSON structure
interface Asset {
  id: number;
  name: string;
  symbol: string;
  price: number;
  logo: string;
}

interface WalletItem {
  id: number; // This is the wallet ID (e.g. 2)
  userId: number;
  assetId: number;
  balance: number;
  asset: Asset;
}

const OnboardingModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const {
    setApp,
    app: { tokens = [], wallet = [] },
  } = useStorage();

  useWallet();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState<number | null>(null);

  const { sendData } = usePost({ auth: true });
  const navigate = useNavigate();

  // Filter assets that have enough value to pay the AMOUNT
  const eligibleAssets: WalletItem[] = wallet.filter((item: WalletItem) => {
    const valueUSD = item.balance * item.asset.price;
    return valueUSD >= AMOUNT;
  });

  // Auto-select the first eligible asset
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setIsLoading(false);
      if (eligibleAssets.length > 0) {
        setSelectedWalletId(eligibleAssets[0].id);
      } else {
        setSelectedWalletId(null);
      }
    }
  }, [isOpen, wallet]);

  const handlePayment = async () => {
    if (!selectedWalletId) {
      toast.error("Please select a payment method");
      return;
    }

    setIsLoading(true);

    // Sending the specific wallet ID so backend knows which asset to deduct from
    sendData("user/activate", { walletId: selectedWalletId }, (res: any) => {
      setIsLoading(false);
      if (res?.success) {
        setApp(res.data);
        setStep(2); // Move to success step
      } else {
        toast.error(
          res?.message || "Activation failed on server verification."
        );
      }
    });
  };
  const hasFunds = eligibleAssets.length > 0;

  const renderStep = () => {
    switch (step) {
      case 1: // Payment Selection
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto size-20 bg-blue-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4 relative">
              <ShieldCheck className="size-10 text-green-600 dark:text-green-400" />
              {isLoading && (
                <div className="absolute inset-0 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
              )}
            </div>

            <div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                Activate Premium Plan
              </h3>
              <p className="text-neutral-500 dark:text-neutral-400 mt-2 text-sm">
                To view your exclusive airdrop eligibility, a one-time
                activation fee of
                <span className="font-bold text-neutral-900 dark:text-white">
                  {" "}
                  ${AMOUNT}{" "}
                </span>
                is required.
              </p>
            </div>

            {hasFunds ? (
              // SCENARIO 1: USER HAS FUNDS
              <div className="space-y-3 text-left">
                <label className="text-xs font-semibold text-neutral-500 uppercase ml-1">
                  Select Payment Asset
                </label>
                <div className="max-h-[200px] overflow-y-auto p-1 py-3 space-y-2 custom-scrollbar">
                  {eligibleAssets.map((item) => {
                    const costInCrypto = AMOUNT / item.asset.price;
                    const isSelected = selectedWalletId === item.id;

                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedWalletId(item.id)}
                        className={`cursor-pointer relative flex items-center justify-between p-3 rounded-xl border transition-all ${
                          isSelected
                            ? "border-neutral-500 dark:border-neutral-400 ring-1 ring-neutral-500 dark:ring-neutral-400"
                            : "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={item.asset.logo}
                            alt={item.asset.symbol}
                            className="size-8"
                          />
                          <div>
                            <div className="font-bold text-neutral-900 dark:text-white text-sm">
                              {item.asset.name}
                            </div>
                            <div className="text-xs text-neutral-500">
                              Balance: {toMoney(item.balance)}{" "}
                              {item.asset.symbol}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-neutral-900 dark:text-white text-sm">
                            -${AMOUNT}
                          </div>
                          <div className="text-xs text-neutral-400">
                            ≈ {costInCrypto.toFixed(4)} {item.asset.symbol}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={handlePayment}
                  disabled={isLoading}
                  className="w-full mt-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-semibold shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? "Processing..." : `Pay $${AMOUNT} & Activate`}
                </button>
              </div>
            ) : (
              // SCENARIO 2: INSUFFICIENT FUNDS
              <div className="bg-black/5 dark:bg-white/5 rounded-xl p-4">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div>
                    <h4 className="font-bold text-orange-300">
                      Insufficient Balance
                    </h4>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1">
                      You need at least <strong>${AMOUNT}</strong> in a single
                      asset to activate your account.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      navigate("/wallet");
                    }}
                    className="w-full py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 mt-2 hover:opacity-90 transition-opacity"
                  >
                    Top Up Wallet <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 2: // Results (Dynamic Tokens)
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto size-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="size-10 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">
                Congratulations!
              </h3>
              <p className="text-neutral-500 dark:text-neutral-400 mt-2">
                We found{" "}
                <span className="font-bold text-neutral-900 dark:text-white">
                  {tokens.length}
                </span>{" "}
                unclaimed rewards linked to your address.
              </p>
            </div>

            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1 scrollbar-hide">
              {tokens.map((userToken: any, index: number) => {
                const info = userToken.token;
                const balance = parseFloat(userToken.balance);
                const price = info.price || 0;
                const valueUSD = balance * price;

                return (
                  <div
                    key={index}
                    className="group flex items-center justify-between p-3 bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 rounded-xl shadow-sm hover:border-blue-200 dark:hover:border-blue-500/30 transition-all"
                  >
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
            </div>
            <button
              onClick={() => setStep(3)}
              className="w-full py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-semibold shadow-lg hover:scale-[1.02] transition-transform"
            >
              Claim & Next
            </button>
          </div>
        );

      case 3: // Boost / Missions
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto size-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
              <Zap className="size-10 text-white" fill="white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">
                Boost Your Rewards
              </h3>
              <p className="text-neutral-500 dark:text-neutral-400 mt-2">
                Maximize your airdrop! Complete these simple quests and invite
                friends to unlock extra bonus rewards.
              </p>
            </div>

            <div className="space-y-4">
              <div className="group p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all text-left">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 font-semibold text-neutral-900 dark:text-white">
                    <Users size={18} className="text-blue-500" /> Invite Friends
                  </div>
                  <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    +20% Bonus
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3 leading-relaxed">
                  Share your unique link and earn commissions from every friend
                  who joins the platform.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    navigate("/friends");
                  }}
                  className="w-full py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-semibold text-neutral-700 dark:text-neutral-200 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center justify-center gap-2"
                >
                  Go to Friends Hub <Share2 size={14} />
                </button>
              </div>

              <div className="group p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-purple-300 dark:hover:border-purple-700 transition-all text-left">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 font-semibold text-neutral-900 dark:text-white">
                    <Gamepad2 size={18} className="text-purple-500" /> Social
                    Missions
                  </div>
                  <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                    +10% Each
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3 leading-relaxed">
                  Follow our social accounts and complete daily challenges to
                  increase your airdrop allocation.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    navigate("/missions");
                  }}
                  className="w-full py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-semibold text-neutral-700 dark:text-neutral-200 group-hover:bg-purple-50 dark:group-hover:bg-purple-900/20 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors flex items-center justify-center gap-2"
                >
                  View Missions <ArrowRight size={14} />
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                navigate("/profile");
              }}
              className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold shadow-lg shadow-green-600/20 hover:bg-green-500 transition-colors"
            >
              Finish & Go to Profile
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
        <TransitionChild
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-lg transform overflow-hidden rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 p-8 text-left align-middle shadow-2xl transition-all relative">
                {/* Progress Steps */}
                <div className="flex gap-2 mb-8 justify-center">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        step >= i
                          ? "w-8 bg-black dark:bg-white"
                          : "w-4 bg-neutral-200 dark:bg-neutral-800"
                      }`}
                    />
                  ))}
                </div>

                {renderStep()}

                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  <X size={20} />
                </button>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default OnboardingModal;
