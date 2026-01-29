import { useState, useMemo } from "react";
import useStorage from "context";
import { Link } from "react-router-dom";
import {
  Search,
  History,
  Lock,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";
import { clsx } from "clsx";
import Transfer from "./transfer";
import PortfolioCard from "./portfolio";
import { useGetData, useWallet } from "hooks/use-query";
import Modal from "components/specific/modal";
import { toMoney } from "utils/helper";
// PortfolioAirdrops removed - unused import causing circular dependency

// Base: Structure, Typography, and Accessibility (Focus rings)
const BUTTON_SMALL_BASE =
  "relative inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold tracking-wide uppercase rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-white dark:focus:ring-offset-neutral-950 disabled:opacity-50 disabled:cursor-not-allowed";

// Deposit: Emerald Gradient + Glow + Lift
export const BUTTON_SMALL_DEPOSIT = `${BUTTON_SMALL_BASE} 
   text-white
   bg-gradient-to-r from-emerald-500 to-teal-600
   hover:from-emerald-600 hover:to-teal-700
   border border-white/5
   active:scale-95 hover:-translate-y-0.5`;

// Withdraw: Rose Gradient + Glow + Lift
export const BUTTON_SMALL_WITHDRAW = `${BUTTON_SMALL_BASE}
   text-white
   bg-gradient-to-r from-red-500 to-rose-600
   hover:from-rose-600 hover:to-red-700
   border border-white/5
   active:scale-95 hover:-translate-y-0.5`;

// Optional: A Neutral Default if you need it for other actions
export const BUTTON_SMALL_NEUTRAL = `${BUTTON_SMALL_BASE}
   bg-neutral-900 text-white hover:bg-neutral-800
   dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200
   shadow-sm hover:shadow-md active:scale-95`;

const CARD_CLASSES =
  "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800";

// --- TYPES ---
export interface NetworkMetadata {
  id: number;
  name: string;
  chain?: string; // API returns 'chain' (e.g., "solana", "eth", "bsc", "tron")
  slug?: string; // Optional fallback
  type?: string;
  logo: string;
  mainAddress?: string;
  main_address?: string; // API uses snake_case
  isActive?: boolean;
  is_active?: boolean; // API uses snake_case
}

export interface AssetNetworkConfig {
  id: number;
  assetId: number;
  networkId: number;
  isActive: boolean;
  canDeposit: boolean;
  canWithdraw: boolean;
  minWithdraw: number;
  minDeposit: number;
  withdrawFee: number;
  contractAddress: string;
  decimals: number;
  network: NetworkMetadata;
}

export interface Asset {
  id: number;
  name: string;
  symbol: string;
  price: number;
  logo: string;
  active: boolean;
  visible: boolean;
  networks: AssetNetworkConfig[];
  balance: number;
  locked: number;
}

const Wallet = () => {
  const { app } = useStorage();
   const { fetchWallet } = useWallet();
  const { data: pureAssets, loading } = useGetData({ path: "wallet/assets" });

  // Ensure wallet is always an array
  const wallet = Array.isArray(app?.wallet) ? app.wallet : [];

  // Modal State
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const [modalType, setModalType] = useState<"deposit" | "withdraw" | null>(
    null
  );
  const stats = useMemo(() => {
    let totalEquity = 0;
    let totalLocked = 0;
    wallet.forEach((a: any) => {
      totalEquity += a.balance * a.asset.price;
      totalLocked += a.locked * a.asset.price;
    });
    return {
      equity: totalEquity,
      available: totalEquity - totalLocked,
      locked: totalLocked,
    };
  }, [wallet]);
  const assets = useMemo(() => {
    // Handle both array and object formats from API
    let assetList: any[] = [];
    if (Array.isArray(pureAssets)) {
      assetList = pureAssets;
    } else if (pureAssets && typeof pureAssets === 'object') {
      // API returns { "0": {...}, "1": {...}, success: true } - extract asset objects
      assetList = Object.entries(pureAssets)
        .filter(([key]) => !isNaN(Number(key)))
        .map(([, value]) => value);
    }

    return assetList
      .filter((a) => a?.visible)
      .map((asset) => {
        // Support both snake_case (API) and camelCase formats
        const w = wallet.find((w: any) => (w.asset_id || w.assetId) === asset.id);
        // Filter out inactive networks (like TRON)
        const activeNetworks = (asset.networks || []).filter((net: any) => {
          const isActive = net.isActive !== false && net.is_active !== false;
          const networkActive = net.network?.isActive !== false && net.network?.is_active !== false;
          return isActive && networkActive;
        });
        return {
          ...asset,
          networks: activeNetworks,
          balance: w ? parseFloat(w.balance) : 0,
          locked: w ? parseFloat(w.locked) : 0,
        };
      })
      // Filter out assets that have NO active networks (like TRX which only has TRON)
      .filter((asset) => asset.networks.length > 0);
  }, [wallet, pureAssets]);

  const openAction = (asset: Asset, type: "deposit" | "withdraw") => {
    setSelectedAsset(asset);
    setModalType(type);
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedAsset(null);
  };

  return (
    <div className="mx-auto min-h-screen w-full max-w-7xl p-4 font-sans text-neutral-900 dark:text-white md:p-8">
      {/* HEADER */}
      <div className="mb-10 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">My Assets</h1>
          <Link to="/history" className={BUTTON_SMALL_BASE}>
            <History className="size-4" />
            <span>History</span>
          </Link>
        </div>
        <PortfolioCard
          equity={stats.equity}
          available={stats.available}
          locked={stats.locked}
        />
      </div>

      {/* SEARCH */}
      <div
        className={clsx(
          "mb-6 flex w-full max-w-sm items-center gap-3 rounded-2xl border px-4 py-3 transition-colors",
          "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900/50"
        )}
      >
        <Search className="size-4 text-neutral-400" />
        <input
          type="text"
          placeholder="Search coin name or symbol..."
          className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-neutral-400"
        />
      </div>

      {/* DESKTOP TABLE */}
      <div
        className={clsx(
          "hidden w-full overflow-hidden rounded-3xl md:block",
          CARD_CLASSES
        )}
      >
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:bg-neutral-900/50">
            <tr>
              <th className="px-6 py-3">Asset</th>
              <th className="px-6 py-3">Price</th>
              <th className="px-6 py-3">Balance</th>
              <th className="px-6 py-3">Total Value</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-sm font-medium dark:divide-neutral-800">
            {assets.map((asset) => (
              <tr
                key={asset.id}
                className="group transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.02]"
              >
                <td className="px-6 py-3">
                  <div className="flex items-center gap-4">
                    <img
                      src={asset.logo}
                      className="size-10 object-cover rounded-xl"
                    />
                    <div>
                      <div className="text-base font-bold">{asset.symbol}</div>
                      <div className="text-xs text-nowrap font-semibold text-neutral-500 mt-1">
                        {asset.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3  text-neutral-500 dark:text-neutral-400">
                  ${toMoney(asset.price)}
                </td>
                <td className="px-6 py-3">
                  <div className="">{asset.balance}</div>
                  {asset.locked > 0 && (
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] text-orange-500">
                      <Lock className="size-3" /> {asset.locked}
                      Locked
                    </div>
                  )}
                </td>
                <td className="px-6 py-3  font-bold">
                  ${asset.balance * asset.price}
                </td>
                <td className="px-6 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openAction(asset, "deposit")}
                      className={BUTTON_SMALL_DEPOSIT}
                    >
                      Deposit
                    </button>
                    <button
                      onClick={() => openAction(asset, "withdraw")}
                      className={BUTTON_SMALL_WITHDRAW}
                    >
                      Withdraw
                    </button>
                    <Link
                      to={`/trade/${asset.symbol}-USDT`}
                      className={BUTTON_SMALL_NEUTRAL}
                    >
                      Trade
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE LIST */}
      <div className="space-y-4 md:hidden">
        {assets.map((asset) => (
          <div
            key={asset.id}
            className={clsx("rounded-3xl p-5 shadow-sm", CARD_CLASSES)}
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={asset.logo} className="size-11 rounded-full" />
                <div>
                  <div className="text-lg font-bold">{asset.symbol}</div>
                  <div className="text-xs text-neutral-500">{asset.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className=" text-base font-bold">
                  ${asset.balance * asset.price}
                </div>
                <div className="text-xs text-neutral-500">{asset.balance}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => openAction(asset, "deposit")}
                className={BUTTON_SMALL_DEPOSIT}
              >
                <ArrowDownToLine className="size-4" /> Deposit
              </button>
              <button
                onClick={() => openAction(asset, "withdraw")}
                className={BUTTON_SMALL_WITHDRAW}
              >
                <ArrowUpFromLine className="size-4" /> Withdraw
              </button>
              <Link
                to={`/trade/${asset.symbol}-USDT`}
                className={BUTTON_SMALL_NEUTRAL}
              >
                Trade
              </Link>
            </div>
          </div>
        ))}
      </div>

      <Modal open={!!modalType} onClose={closeModal}>
       <Transfer 
         asset={selectedAsset} 
         modalType={modalType}
         onSuccess={fetchWallet}
       />
      </Modal>
    </div>
  );
};

export default Wallet;
