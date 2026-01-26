import { useState, useMemo } from "react";
import {
  Edit2,
  Check,
  Rocket,
  Zap,
  Crown,
  TrendingUp,
  Shield,
  Wallet,
  Star,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";
import useStorage from "context";
import { formatDate, toMoney } from "utils/helper";
import { usePost } from "hooks/use-query";
import Modal from "components/specific/modal";

export default function ProfilePage() {
  const {
    app: { user, tokens = [] },
    setApp,
  } = useStorage();

  const { sendData } = usePost({ auth: true });

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tempName, setTempName] = useState("");

  const netWorth = useMemo(() => {
    if (!tokens || tokens.length === 0) return 0;
    return tokens.reduce((acc: number, item: any) => {
      const qty = parseFloat(item.balance);
      const price = item.token?.price || 0;
      return acc + qty * price;
    }, 0);
  }, [tokens]);

  const handleSaveName = async () => {
    if (!tempName.trim()) return setIsEditing(false);
    setIsLoading(true);
    sendData("user/update", { fullName: tempName.trim() }, (res: any) => {
      setIsEditing(false);
      setIsLoading(false);

      if (res?.success) {
        setApp(res.data);
        toast.success("Identity updated successfully!");
      } else {
        toast.error("Failed to update name");
      }
    });
  };

  if (!user)
    return (
      <div className="px-10 py-32 text-center animate-pulse">
        Loading Profile...
      </div>
    );

  // Derived Data
  const nextLevelFee = (user.level + 1) * 3;
  const nextBoostFee = (user.boost + 1) * 10;
  const wallet = user.links?.[0]?.address;
  const userWallet =
    user.links.length > 0
      ? wallet.slice(0, 6) + "..." + wallet.slice(-4)
      : "No Name";
  const displayName = user.fullName || userWallet;

  return (
    <div className="max-w-6xl pb-32 mx-auto px-4 md:px-8 space-y-8">
      <div className="relative rounded-[32px] overflow-hidden bg-white dark:bg-[#0F0F13] border border-neutral-100 dark:border-white/5 p-8 shadow-2xl shadow-blue-900/5">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neutral-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">
          {/* Avatar */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-[24px] bg-gradient-to-br from-rose-400 to-rose-300 flex items-center justify-center text-4xl font-bold text-white  select-none">
              {displayName[0]?.toUpperCase()}
            </div>
            <div className="absolute -bottom-3 -right-3">
              <div className="px-3 py-1 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold border-4 border-white dark:border-[#0F0F13]">
                Lvl {user.level}
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1 w-full">
            <div className="flex items-center gap-3 mb-2">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    defaultValue={displayName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="bg-neutral-100 dark:bg-white/10 border-none rounded-lg px-3 py-1 text-xl font-bold text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    {isLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Check size={18} />
                    )}
                  </button>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">
                    {displayName}
                  </h1>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 text-neutral-400 hover:text-blue-500 transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400">
              <div className="flex items-center gap-1.5 bg-neutral-50 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-neutral-100 dark:border-white/5">
                <Wallet size={14} /> {userWallet}
              </div>
              <div className="flex items-center gap-1.5">
                <Shield size={14} /> Joined{" "}
                {user.createdAt ? formatDate(user.createdAt) : "Recently"}
              </div>
            </div>
          </div>

          {/* Net Worth Display */}
          <div className="border border-black/10 dark:border-white/10 p-5 rounded-2xl text-right min-w-[180px]">
            <div className="text-xs font-bold uppercase text-neutral-400 mb-1">
              Net Worth
            </div>
            <div className="text-3xl font-bold text-neutral-900 dark:text-white">
              ${toMoney(netWorth)}
            </div>
          </div>
        </div>
      </div>

      {/* --- 3. Stats Footer --- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Current Level",
            value: user.level,
            icon: Crown,
            color: "text-yellow-500",
          },
          {
            label: "Boost Status",
            value: "Available",
            icon: Rocket,
            color: "text-blue-500",
          },
          {
            label: "Reputation",
            value: "Verified",
            icon: Star,
            color: "text-purple-500",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white dark:bg-white/5 rounded-2xl p-4 flex items-center gap-4 border border-neutral-100 dark:border-white/5 shadow-sm dark:shadow-none"
          >
            <div
              className={`p-2 bg-neutral-100 dark:bg-black rounded-lg shadow-inner ${stat.color}`}
            >
              <stat.icon size={20} />
            </div>
            <div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-wide">
                {stat.label}
              </div>
              <div className="text-lg font-bold text-neutral-900 dark:text-white">
                {stat.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
