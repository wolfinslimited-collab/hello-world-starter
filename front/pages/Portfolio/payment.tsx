import { useState } from "react";
import {
  Rocket,
  Crown,
  Loader2,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import useStorage from "context";
import { usePost } from "hooks/use-query";
import { useNavigate } from "react-router-dom";
import { toMoney } from "utils/helper";
import { toast } from "react-toastify";

type ActionType = "UPGRADE" | "BOOST" | null;
const PaymentModal = ({
  type,
  cost,
  close,
}: {
  type: ActionType;
  cost: number;
  close?: any;
}) => {
  const {
    app: { wallet = [], user },
    setApp,
  } = useStorage();
  const navigate = useNavigate();

  const { sendData } = usePost({ auth: true });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState<number | null>(null);

  const eligibleAssets: any[] = wallet.filter((item: any) => {
    const valueUSD = item.balance * item.asset.price;
    return valueUSD >= cost;
  });
  const hasFunds = eligibleAssets.length > 0;

  const handlePayment = async () => {
    setIsLoading(true);
    const endpoint = type === "UPGRADE" ? "user/upgrade" : "user/boost";
    sendData(endpoint, { walletId: selectedWalletId }, (res: any) => {
      setIsLoading(false);
      if (res?.success) {
        setApp(res.data);
        if (type === "UPGRADE") {
          toast.success(`Level Up! Welcome to Level ${user.level}`);
        } else {
          toast.success("BOOST ACTIVATED! All tokens doubled! 🚀");
        }
      } else {
        toast.error("Transaction failed");
      }
      close?.();
    });
  };

  if (!type) return null;

  const isUpgrade = type === "UPGRADE";
  const title = isUpgrade ? "Level Up Account" : "Activate Asset Boost";
  const description = isUpgrade
    ? "Unlock exclusive tiers and higher drop limits."
    : "Instantly 2x your token balances (Permanent effect).";
  const Icon = isUpgrade ? Crown : Rocket;
  const colorClass = isUpgrade
    ? "text-yellow-500 bg-yellow-50 dark:bg-yellow-500/20"
    : "text-blue-500 bg-blue-50 dark:bg-blue-500/20";

  return (
    <div className="w-full relative">
      {/* Icon Header */}
      <div className="flex justify-center mb-6">
        <div
          className={`size-20 rounded-full flex items-center justify-center ${colorClass}`}
        >
          {isLoading ? (
            <Loader2 className="animate-spin size-10" />
          ) : (
            <Icon className="size-10" />
          )}
        </div>
      </div>

      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
          {isLoading ? "Processing..." : title}
        </h3>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">
          {isLoading
            ? "Please wait while we confirm your transaction."
            : description}
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
              const costInCrypto = cost / item.asset.price;
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
                        Balance: {toMoney(item.balance)} {item.asset.symbol}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-neutral-900 dark:text-white text-sm">
                      -${cost}
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
            {isLoading ? "Processing..." : `Pay $${cost} & Activate`}
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
                You need at least <strong>${cost}</strong> in a single asset to
                activate your account.
              </p>
            </div>
            <button
              onClick={() => {
                close?.();
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
};

export default PaymentModal;
