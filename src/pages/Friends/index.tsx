import React, { useEffect, useState, useMemo } from "react";
import {
  Copy,
  CheckCircle2,
  Share2,
  Users,
  Coins,
  Wallet,
  Clock,
  UserPlus,
  Gift,
  ShieldCheck,
  Zap,
} from "lucide-react";
import useStorage from "context";
import { get } from "utils/request";
import { timeAgo } from "utils/helper";

const FriendSkeleton = () => (
  <div className="flex items-center justify-between p-4 bg-white dark:bg-[#0F0F13] border border-neutral-100 dark:border-white/5 rounded-2xl animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-white/10" />
      <div>
        <div className="h-4 w-32 bg-neutral-200 dark:bg-white/10 rounded-md" />
        <div className="h-3 w-24 bg-neutral-200 dark:bg-white/10 rounded-md mt-2" />
      </div>
    </div>
    <div className="text-right">
      <div className="h-3 w-16 bg-neutral-200 dark:bg-white/10 rounded-md" />
      <div className="h-5 w-20 bg-neutral-200 dark:bg-white/10 rounded-md mt-1.5" />
    </div>
  </div>
);

export default function ReferralHub() {
  const {
    app: { user },
    setting: { token, isLoged },
    memory: { friends = null, tokens = [] }, // Added tokens here
    setMemory,
  } = useStorage();

  const [copied, setCopied] = useState(false);

  // Added rewardIcons logic
  const rewardIcons = useMemo(() => {
    return [...tokens].sort(() => 0.5 - Math.random()).slice(0, 3);
  }, [tokens]);

  const getFriends = () => {
    get("user/friends", { token }).then((res: any) => {
      if (res?.success) {
        setMemory({ friends: res.data.users || [] });
      } else {
        setMemory({ friends: [] });
      }
    });
  };

  useEffect(() => {
    if (isLoged && friends === null) {
      getFriends();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoged]);

  const handleCopy = () => {
    const link = `${window.location.origin}?ref=${user?.id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const link = `${window.location.origin}?ref=${user?.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me and earn rewards!",
          text: `Use my link to sign up and start earning.`,
          url: link,
        });
      } catch (error) {
        console.error("Sharing failed:", error);
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const myName = (user: any) => {
    const wallet = user.links[0].address;
    const userWallet = wallet.slice(0, 6) + "..." + wallet.slice(-4);
    return user.fullName || userWallet;
  };

  // --- Reward Badge Component for re-use ---
  const RewardBadge = () => (
    <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-full bg-neutral-50 dark:bg-white/5 border border-neutral-100 dark:border-white/5 align-middle mx-1">
      <span className="font-bold text-neutral-900 dark:text-neutral-100">
        50
      </span>
      {tokens.length > 0 && (
        <div className="flex -space-x-2 overflow-hidden py-0.5 pl-0.5">
          {rewardIcons.map((token: any, i: number) => (
            <img
              key={token.id || i}
              className="inline-block h-5 w-5 rounded-full ring-2 ring-white dark:ring-[#1A1A1E] bg-white object-cover"
              src={token.logo_url || token.logoUrl}
              alt={token.symbol}
            />
          ))}
        </div>
      )}
      <span className="text-sm text-neutral-700 dark:text-neutral-200">
        +{tokens.length} Tokens
      </span>
    </div>
  );

  if (!isLoged) {
    return (
      <div className="max-w-6xl mx-auto my-24 px-4">
        <div className="relative overflow-hidden rounded-[32px] bg-white dark:bg-[#0F0F13] border border-neutral-100 dark:border-white/5 p-8 md:p-16 text-center">
          {/* Background Ambience */}
          <div className="absolute top-0 inset-x-0 w-full h-full bg-gradient-to-b from-red-300/5 to-transparent pointer-events-none" />
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-red-300/30 to-transparent" />

          <div className="relative z-10 flex flex-col items-center">
            {/* Icon */}
            <div className="w-20 h-20 rounded-3xl bg-neutral-50 dark:bg-white/5 border border-neutral-100 dark:border-white/5 flex items-center justify-center mb-8 rotate-3 shadow-lg">
              <Gift size={40} className="text-red-300" />
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-6 tracking-tight">
              Turn Connections into <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-violet-600 dark:from-red-400 dark:to-violet-400">
                Crypto Rewards
              </span>
            </h1>

            {/* UPDATED DESCRIPTION */}
            <div className="text-lg text-neutral-500 dark:text-neutral-400 max-w-xl mb-12 leading-relaxed">
              Join our top-tier referral program. Invite friends and earn
              <RewardBadge />
              on every token they claim. It's simple, transparent, and forever.
            </div>

            {/* Benefits Grid */}
            <div className="grid md:grid-cols-3 gap-6 w-full mb-12">
              <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-white/5 border border-neutral-100 dark:border-white/5 flex flex-col items-center gap-3">
                <Coins className="text-amber-500" size={28} />
                <h3 className="font-bold text-neutral-900 dark:text-white">
                  Passive Income
                </h3>
                <p className="text-xs text-neutral-500">
                  Earn continuously from your network's activity.
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-white/5 border border-neutral-100 dark:border-white/5 flex flex-col items-center gap-3">
                <ShieldCheck className="text-green-500" size={28} />
                <h3 className="font-bold text-neutral-900 dark:text-white">
                  Secure Payouts
                </h3>
                <p className="text-xs text-neutral-500">
                  Rewards are sent directly to your wallet.
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-white/5 border border-neutral-100 dark:border-white/5 flex flex-col items-center gap-3">
                <Zap className="text-red-300" size={28} />
                <h3 className="font-bold text-neutral-900 dark:text-white">
                  Instant Activation
                </h3>
                <p className="text-xs text-neutral-500">
                  Connect your wallet to get your link immediately.
                </p>
              </div>
            </div>

            {/* Connect Wallet Button */}
            <div className="scale-110"></div>

            <p className="mt-6 text-xs text-neutral-400 font-medium">
              No registration required. Just connect and share.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const referralLink = `${window.location.origin}?ref=${user?.id}`;

  return (
    <div className="max-w-5xl mx-auto space-y-8 px-4 my-24">
      {/* --- 1. Hero & Stats Section --- */}
      <div className="relative overflow-hidden rounded-[32px] bg-white dark:bg-[#0F0F13] p-8 shadow-2xl shadow-red-900/5 border border-neutral-100 dark:border-white/5 transition-all duration-300">
        {/* Animated Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-black/10 dark:bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 dark:bg-white/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              {/* Main Title */}
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-neutral-800 dark:text-neutral-200">
                Invite Friends,
                <span className="ms-2 text-transparent bg-clip-text bg-gradient-to-r from-black dark:from-white to-red-300 ">
                  Earn Forever.
                </span>
              </h1>

              {/* --- UPDATED DESCRIPTION START --- */}
              <div className="text-neutral-500 dark:text-neutral-400 max-w-lg text-sm leading-relaxed">
                Earn <RewardBadge /> rewards whenever your friends activate a
                plan or make a deposit. Passive income, simplified.
              </div>
              {/* --- UPDATED DESCRIPTION END --- */}
            </div>

            {/* Total Invited Stat Card */}
            <div className="border border-black/10 dark:border-white/10 p-5 rounded-2xl backdrop-blur-sm min-w-[180px]">
              <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 text-xs font-bold uppercase mb-1">
                <Coins size={14} /> Total Invited
              </div>
              <div className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white text-center">
                {friends?.length ?? 0}
              </div>
            </div>
          </div>

          {/* Link Input Box */}
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="flex-1 relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Wallet
                  size={18}
                  className="text-neutral-400 dark:text-neutral-500"
                />
              </div>
              <input
                readOnly
                value={referralLink}
                className="w-full h-14 pl-12 pr-24 bg-neutral-100 dark:bg-black/20 border border-neutral-200 dark:border-white/10 rounded-2xl text-sm  text-neutral-600 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-red-300/20 focus:border-red-300 transition-all truncate"
              />
              <div className="absolute inset-y-2 right-2">
                <button
                  onClick={handleCopy}
                  className="h-full px-4 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs font-bold hover:bg-neutral-50 dark:hover:bg-white/10 transition-colors flex items-center gap-2 shadow-sm"
                >
                  {copied ? (
                    <CheckCircle2 size={14} className="text-green-500" />
                  ) : (
                    <Copy size={14} />
                  )}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
            <button
              onClick={handleShare}
              className="px-6 rounded-2xl bg-red-300  text-black font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/20 active:scale-95 h-12"
            >
              <Share2 size={18} />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* --- 2. Friends List Section --- */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <div className="p-3 rounded-2xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10">
              <Users
                className="text-neutral-900 dark:text-white fill-neutral-900/10"
                size={28}
              />
            </div>
            <div>Your Network</div>
            <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 text-xs rounded-full">
              {friends?.length ?? 0}
            </span>
          </h3>
          {/* <button className="text-sm font-semibold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1">
            View Leaderboard <ArrowUpRight size={14} />
          </button> */}
        </div>

        <div className="grid gap-3">
          {/* Loading State */}
          {friends === null && (
            <>
              <FriendSkeleton />
              <FriendSkeleton />
              <FriendSkeleton />
            </>
          )}

          {/* Render Friends List */}
          {friends &&
            friends.map((friend: any) => (
              <div
                key={friend.id}
                className="group flex items-center justify-between p-4 bg-white dark:bg-[#0F0F13] border border-neutral-100 dark:border-white/5 rounded-2xl hover:border-red-200 dark:hover:border-red-900/30 transition-all duration-300"
              >
                {/* User Info */}
                <div className="flex items-center gap-4 truncate">
                  <div className="relative flex-shrink-0">
                    <img
                      src={`https://api.dicebear.com/7.x/identicon/svg?seed=${friend.referee.id}`}
                      alt={`${friend.referee.id} avatar`}
                      className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-white/5"
                    />
                  </div>
                  <div className="truncate">
                    <div className="font-bold text-neutral-900 dark:text-white text-base truncate">
                      {myName(friend.referee)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                      <Clock size={12} /> Joined {timeAgo(friend.createdAt)}
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="text-right">
                  <RewardBadge />
                </div>
              </div>
            ))}
        </div>

        {/* Empty State */}
        {friends && friends.length === 0 && (
          <div className="p-12 text-center border-2 border-dashed border-neutral-200 dark:border-white/10 rounded-2xl bg-neutral-50/50 dark:bg-white/[0.02] flex flex-col items-center">
            <div className="size-16 bg-white dark:bg-white/5 rounded-2xl flex items-center justify-center mb-4 text-neutral-400 shadow-sm">
              <UserPlus size={32} />
            </div>
            <h4 className="font-bold text-lg text-neutral-800 dark:text-white mb-1">
              Your Network is Empty
            </h4>
            <p className="text-sm text-neutral-500 max-w-xs">
              Share your referral link to grow your network and start earning
              passive income from every claim.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
