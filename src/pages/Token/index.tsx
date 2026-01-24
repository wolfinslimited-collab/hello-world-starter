import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import useStorage from "context"; // Your custom storage hook
import ReactMarkdown from "react-markdown"; // Recommended for description rendering
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  Globe,
  Twitter,
  MessageCircle,
  Timer,
  Zap,
  Coins,
  Users,
  AlertCircle,
} from "lucide-react";
import ClaimButton from "./claim";

// --- Types (Based on your provided data structure) ---
interface TokenData {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  description: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  category: string;
  tags: string[];
  network: string;
  initialAirdrop: number;
  dailyReward: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  isFeatured: boolean;
  price: number;
  progress: number;
}

interface UserTokenData {
  id: number;
  tokenId: number;
  balance: number;
  lastActionAt: string; // ISO Date string
}

export default function TokenDetailsPage() {
  const { slug } = useParams();
  const {
    memory: { tokens = [] },
    app: { tokens: userTokens = [] },
  } = useStorage();

  const token = useMemo(
    () => tokens.find((t: TokenData) => t.slug === slug),
    [tokens, slug]
  );

  // 3. Find the user's interaction with this token (Personal Data)
  const userToken = useMemo(
    () => userTokens.find((ut: UserTokenData) => ut.tokenId === token?.id),
    [userTokens, token]
  );

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-neutral-500">
        <AlertCircle className="size-10 mb-4 opacity-50" />
        <p>Token not found.</p>
        <Link to="/airdrops" className="mt-4 text-blue-600 hover:underline">
          Back to Airdrops
        </Link>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24 animate-in fade-in duration-500">
      <Link
        to="/airdrops"
        className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to Explore
      </Link>

      <div className="flex flex-col md:flex-row gap-6 md:items-start justify-between mb-12">
        <div className="flex items-center gap-6">
          <div className="relative shrink-0">
            <img
              src={token.logoUrl || "/placeholder-icon.png"}
              alt={token.name}
              className="size-20 md:size-24 rounded-2xl shadow-lg ring-4 ring-white dark:ring-neutral-800 object-cover bg-white"
            />
            {token.isFeatured && (
              <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white dark:border-neutral-900 shadow-sm">
                FEATURED
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white tracking-tight">
                {token.name}
              </h1>
              <span className="px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs font-bold border border-neutral-200 dark:border-neutral-700">
                {token.symbol}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-green-500 animate-pulse" />
                {token.network} Network
              </span>
              <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
              <span>{token.category}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          {token.websiteUrl && (
            <SocialButton
              href={token.websiteUrl}
              icon={Globe}
              label="Website"
            />
          )}
          <SocialButton href="#" icon={Twitter} label="Twitter" />
          <SocialButton href="#" icon={MessageCircle} label="Telegram" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatItem
              label="Daily Reward"
              value={`${token.dailyReward} ${token.symbol}`}
              icon={Zap}
              highlight
            />
            <StatItem label="Price" value={`$${token.price}`} icon={Coins} />
            <StatItem
              label="Progress"
              value={`${token.progress}%`}
              icon={Timer}
            />
            <StatItem label="Participants" value="12.5k" icon={Users} />
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <div className="p-1 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
              <div className="p-6 rounded-xl text-black dark:text-white">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h2: ({ node, ...props }) => (
                      <h2
                        className="text-xl font-bold mt-6 mb-4 flex items-center gap-2"
                        {...props}
                      />
                    ),
                    h3: ({ node, ...props }) => (
                      <h3
                        className="text-lg font-semibold mt-4 mb-2 text-neutral-800 dark:text-neutral-200"
                        {...props}
                      />
                    ),
                    p: ({ node, ...props }) => (
                      <p
                        className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4"
                        {...props}
                      />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul
                        className="list-disc pl-5 space-y-2 mb-4 text-neutral-600 dark:text-neutral-400"
                        {...props}
                      />
                    ),
                    li: ({ node, ...props }) => (
                      <li className="pl-1" {...props} />
                    ),
                    strong: ({ node, ...props }) => (
                      <strong
                        className="font-semibold text-neutral-900 dark:text-white"
                        {...props}
                      />
                    ),
                    hr: ({ node, ...props }) => (
                      <hr className="border-t border-black/10 dark:border-white/10" />
                    ),
                  }}
                >
                  {token.description}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <ClaimCard token={token} userToken={userToken} />

          <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 space-y-4">
            <div>
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">
                Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {token.tags.map((tag: any) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">
                Timeline
              </h4>
              <div className="space-y-3">
                <TimelineItem
                  date={token.startsAt}
                  label="Start Date"
                  active={true}
                />
                <TimelineItem
                  date={token.endsAt}
                  label="End Date"
                  active={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

const ClaimCard = ({
  token,
  userToken,
}: {
  token: TokenData;
  userToken?: UserTokenData;
}) => {
  return (
    <div className="sticky top-24 p-1 rounded-3xl bg-gradient-to-b from-neutral-100 to-white dark:from-neutral-800 dark:to-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl shadow-neutral-200/50 dark:shadow-none">
      <div className="bg-white dark:bg-neutral-900 rounded-[20px] p-5 space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-neutral-500">
            Your Balance
          </span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-neutral-900 dark:text-white">
              {userToken ? userToken.balance.toLocaleString() : "0.00"}
            </span>
            <span className="text-sm font-bold text-neutral-400">
              {token.symbol}
            </span>
          </div>
        </div>

        <div className="h-px w-full bg-neutral-100 dark:bg-neutral-800" />

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Daily Reward</span>
            <span className="font-bold text-green-600 dark:text-green-400">
              +{token.dailyReward} {token.symbol}
            </span>
          </div>
          <div className="mt-6" />
          <ClaimButton token={token} userToken={userToken} variant={"full"} />
        </div>

        <p className="text-xs text-center text-neutral-400 dark:text-neutral-500">
          Reset occurs 24 hours after your last claim.
        </p>
      </div>
    </div>
  );
};

const SocialButton = ({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: any;
  label: string;
}) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className="p-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:text-blue-600 dark:hover:text-white hover:border-blue-200 dark:hover:border-neutral-600 transition-all group"
    title={label}
  >
    <Icon className="size-5 group-hover:scale-110 transition-transform" />
  </a>
);

const StatItem = ({ label, value, icon: Icon, highlight }: any) => (
  <div
    className={`p-4 rounded-xl border ${
      highlight
        ? "bg-indigo-50 border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-900/30"
        : "bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800"
    }`}
  >
    <div className="flex items-center gap-2 mb-2">
      <Icon
        className={`size-4 ${
          highlight ? "text-indigo-600" : "text-neutral-400"
        }`}
      />
      <span
        className={`text-xs font-medium ${
          highlight
            ? "text-indigo-600 dark:text-indigo-400"
            : "text-neutral-500"
        }`}
      >
        {label}
      </span>
    </div>
    <div className="font-bold text-neutral-900 dark:text-white text-lg">
      {value}
    </div>
  </div>
);

const TimelineItem = ({ date, label, active }: any) => (
  <div className="flex items-center gap-3">
    <div
      className={`size-2.5 rounded-full border-2 ${
        active
          ? "bg-green-500 border-green-500"
          : "bg-transparent border-neutral-300 dark:border-neutral-700"
      }`}
    />
    <div className="flex flex-col">
      <span className="text-xs font-medium text-neutral-900 dark:text-white">
        {new Date(date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </span>
      <span className="text-[10px] text-neutral-500 uppercase">{label}</span>
    </div>
  </div>
);
