import React, { useState } from "react";
import {
  TrendingUp,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  X,
  Target,
  Zap,
} from "lucide-react";
import { EmptyUI, LoadingUI } from "./utils";

// --- Types ---

interface PositionPair {
  id: number;
  symbol: string;
  base: string;
  quote: string;
  pricePrecision: number;
  quantityPrecision: number;
}

interface Position {
  id: number;
  userId: number;
  pairId: number;
  side: "LONG" | "SHORT" | string;
  entryPrice: number;
  markPrice: number;
  liquidationPrice: number | null;
  amount: number;
  leverage: number;
  margin: number;
  unrealizedPnL: number;
  roe: number;
  createdAt: string;
  updatedAt: string;
  pair: PositionPair;
}

interface PositionsListProps {
  data?: Position[];
  loading?: boolean;
  onAction: (positionId: number) => void | Promise<void>; // Market Close action
  actionLoading: boolean | number; // Can be a boolean or the ID of the position being closed
}

// --- Main Component ---

export default function PositionsList({
  data,
  loading,
  onAction,
  actionLoading,
}: PositionsListProps) {
  const [positionToClose, setPositionToClose] = useState<Position | null>(null);

  const handleConfirmClose = async () => {
    if (!positionToClose) return;
    try {
      await onAction(positionToClose.id);
      setPositionToClose(null);
    } catch (err) {
      console.error("Failed to close position", err);
    }
  };

  // Helper to check if a specific ID is loading (handles both boolean and ID matching)
  const isProcessing = (id: number) => {
    if (typeof actionLoading === "boolean") return actionLoading;
    return actionLoading === id;
  };

  if (loading) return <LoadingUI message="Syncing Positions..." />;

  if (!data?.length) {
    return (
      <EmptyUI
        icon={<TrendingUp size={48} />}
        title="No Open Positions"
        subtitle="Your active futures trades will appear here."
      />
    );
  }

  return (
    <>
      <div className="w-full overflow-hidden">
        {/* Mobile View (Cards) */}
        <div className="block md:hidden divide-y divide-neutral-100 dark:divide-neutral-800">
          {data.map((pos) => (
            <MobilePositionCard
              key={pos.id}
              position={pos}
              onClose={() => setPositionToClose(pos)}
            />
          ))}
        </div>

        {/* Desktop View (Table) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="text-[10px] uppercase font-bold tracking-wider bg-black/5 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 border-b border-neutral-300 dark:border-neutral-700">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Market / Side</th>
                <th className="px-4 py-3 whitespace-nowrap">Size / Leverage</th>
                <th className="px-4 py-3 whitespace-nowrap">Entry / Mark</th>
                <th className="px-4 py-3 whitespace-nowrap">Liq. Price</th>
                <th className="px-4 py-3 whitespace-nowrap text-right">
                  PnL (ROE%)
                </th>
                <th className="px-4 py-3 whitespace-nowrap text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-sm font-medium text-neutral-700 dark:text-neutral-200">
              {data.map((pos) => (
                <DesktopPositionRow
                  key={pos.id}
                  position={pos}
                  onClose={() => setPositionToClose(pos)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {positionToClose && (
        <ClosePositionModal
          position={positionToClose}
          isOpen={!!positionToClose}
          isProcessing={isProcessing(positionToClose.id)}
          onClose={() => setPositionToClose(null)}
          onConfirm={handleConfirmClose}
        />
      )}
    </>
  );
}

// --- Sub-Components ---

function DesktopPositionRow({
  position,
  onClose,
}: {
  position: Position;
  onClose: () => void;
}) {
  const { pair } = position;

  return (
    <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors group">
      {/* Market / Side */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex flex-col gap-1.5">
          <span className="font-bold text-xs text-neutral-900 dark:text-white">
            {pair.symbol}
          </span>
          <SideBadge side={position.side} />
        </div>
      </td>

      {/* Size / Leverage */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-mono font-medium">
            {position.amount.toLocaleString(undefined, {
              minimumFractionDigits: pair.quantityPrecision,
            })}{" "}
            <span className="text-[10px] text-neutral-400">{pair.base}</span>
          </span>
          <div className="flex items-center gap-1 text-[10px] text-neutral-500">
            <Zap size={10} className="text-amber-500" />
            <span className="bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
              {position.leverage}x
            </span>
          </div>
        </div>
      </td>

      {/* Entry / Mark */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex flex-col gap-1 text-xs tabular-nums">
          <div className="flex justify-between gap-3">
            <span className="text-neutral-400 text-[10px]">Entry</span>
            <span>
              {position.entryPrice.toLocaleString(undefined, {
                minimumFractionDigits: pair.pricePrecision,
              })}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-neutral-400 text-[10px]">Mark</span>
            <span className="text-neutral-900 dark:text-neutral-200">
              {position.markPrice.toLocaleString(undefined, {
                minimumFractionDigits: pair.pricePrecision,
              })}
            </span>
          </div>
        </div>
      </td>

      {/* Liquidation Price */}
      <td className="px-4 py-3 whitespace-nowrap">
        {position.liquidationPrice ? (
          <span className="text-xs text-rose-500 font-medium tabular-nums flex items-center gap-1">
            <Target size={12} />
            {position.liquidationPrice.toLocaleString(undefined, {
              minimumFractionDigits: pair.pricePrecision,
            })}
          </span>
        ) : (
          <span className="text-[10px] text-neutral-400 italic">--</span>
        )}
      </td>

      {/* PnL */}
      <td className="px-4 py-3 whitespace-nowrap text-right">
        <PnLDisplay value={position.unrealizedPnL} roe={position.roe} />
      </td>

      {/* Action */}
      <td className="px-4 py-3 whitespace-nowrap text-right">
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500 hover:text-white hover:bg-neutral-900 dark:hover:bg-white dark:hover:text-black border border-neutral-200 dark:border-neutral-700 rounded-lg transition-all"
        >
          Close
        </button>
      </td>
    </tr>
  );
}

function MobilePositionCard({
  position,
  onClose,
}: {
  position: Position;
  onClose: () => void;
}) {
  return (
    <div className="p-4 flex flex-col gap-3">
      {/* Top Row: Symbol, Side, Leverage */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-neutral-900 dark:text-white">
            {position.pair.symbol}
          </span>
          <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-500 font-bold">
            {position.leverage}x
          </span>
        </div>
        <SideBadge side={position.side} />
      </div>

      {/* PnL & Main Stats Box */}
      <div className="p-3 border border-neutral-200 dark:border-neutral-800 rounded-md bg-neutral-50/50 dark:bg-neutral-900/50">
        <div className="flex justify-between items-center mb-3 border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <span className="text-xs text-neutral-500 font-medium">
            Unrealized PnL
          </span>
          <PnLDisplay value={position.unrealizedPnL} roe={position.roe} />
        </div>

        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
          <div className="flex flex-col">
            <span className="text-[10px] text-neutral-400">Entry Price</span>
            <span className="font-medium tabular-nums">
              {position.entryPrice.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[10px] text-neutral-400">Mark Price</span>
            <span className="font-medium tabular-nums text-neutral-900 dark:text-white">
              {position.markPrice.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-neutral-400">Size</span>
            <span className="font-medium tabular-nums">
              {position.amount} {position.pair.base}
            </span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[10px] text-neutral-400">Liq. Price</span>
            <span className="font-medium tabular-nums text-rose-500">
              {position.liquidationPrice
                ? position.liquidationPrice.toLocaleString()
                : "--"}
            </span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={onClose}
        className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
      >
        Close Position
      </button>
    </div>
  );
}

// --- Helpers ---

function SideBadge({ side }: { side: string }) {
  const isLong = side === "LONG" || side === "BUY";
  return (
    <div>
      <span
        className={`inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded border ${
          isLong
            ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
            : "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400"
        }`}
      >
        {isLong ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
        {side}
      </span>
    </div>
  );
}

function PnLDisplay({ value, roe }: { value: number; roe: number }) {
  const isPos = value >= 0;
  const colorClass = isPos ? "text-emerald-500" : "text-rose-500";

  return (
    <div className={`flex flex-col items-end ${colorClass}`}>
      <span className="font-bold text-sm tabular-nums leading-none">
        {isPos ? "+" : ""}
        {value.toLocaleString(undefined, {
          style: "currency",
          currency: "USD",
        })}
      </span>
      <span className="text-[10px] font-bold opacity-80 tabular-nums">
        {isPos ? "+" : ""}
        {roe.toFixed(2)}%
      </span>
    </div>
  );
}

// --- Modal Component ---

function ClosePositionModal({
  position,
  isOpen,
  onClose,
  onConfirm,
  isProcessing,
}: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center gap-4">
          <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-full text-neutral-600 dark:text-neutral-300">
            <AlertTriangle size={32} />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
              Close Position?
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-[260px] mx-auto">
              Are you sure you want to market close your
              <span className="font-bold text-neutral-800 dark:text-neutral-200 mx-1">
                {position.side}
              </span>
              position on
              <span className="font-bold text-neutral-800 dark:text-neutral-200 mx-1">
                {position.pair.symbol}
              </span>
              ?
            </p>
          </div>

          <div className="flex gap-3 w-full pt-2">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-4 py-2.5 text-sm font-bold text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isProcessing}
              className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-black dark:bg-white dark:text-black hover:opacity-90 rounded-lg shadow-lg transition-all flex justify-center items-center gap-2"
            >
              {isProcessing ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                "Confirm Close"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
