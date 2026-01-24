import React from "react";
import { ShieldAlert } from "lucide-react";
import { EmptyUI, LoadingUI } from "./utils";

// --- Types ---
interface Trade {
  id: string;
  createdAt: string | number | Date;
  side: "BUY" | "SELL" | string;
  type: "LIMIT" | "MARKET" | string;
  status: "FILLED" | "CANCELED" | "FAILED" | "OPEN" | "PENDING" | string;
  filledQty: number;
  quantity: number;
  price: number;
  avgFillPrice: number;
  errorMessage?: string;
  pair: {
    symbol: string;
    pricePrecision: number;
  };
}

interface HistoryListProps {
  data?: Trade[];
  loading?: boolean;
}

// --- Helper Components (Assumed Imports) ---
// I've included basic versions here just in case you don't have them
const SideBadge = ({ side }: { side: string }) => {
  const isBuy = side.toUpperCase() === "BUY";
  return (
    <span
      className={`text-[12px] font-bold px-1.5 py-0.5 rounded ${
        isBuy
          ? "text-emerald-500 bg-emerald-500/10"
          : "text-rose-500 bg-rose-500/10"
      }`}
    >
      {side}
    </span>
  );
};

// --- Main Component ---
export default function HistoryList({ data, loading }: HistoryListProps) {
  if (loading) return <LoadingUI message="Retrieving Archives" />;

  if (!data?.length) {
    return (
      <EmptyUI
        icon={<ShieldAlert size={48} />}
        title="Archives Empty"
        subtitle="Your completed trade records will be stored here."
      />
    );
  }

  return (
    <div className="w-full overflow-hidden">
      {/* Mobile View (Cards) */}
      <div className="block md:hidden divide-y divide-neutral-200 dark:divide-neutral-800">
        {data.map((item) => (
          <MobileTradeCard key={item.id} item={item} />
        ))}
      </div>

      {/* Desktop View (Table) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="text-[10px] uppercase font-bold tracking-wider bg-black/5 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 border-b border-neutral-300 dark:border-neutral-700">
            <tr>
              <th className="px-4 py-3 whitespace-nowrap">Time</th>
              <th className="px-4 py-3 whitespace-nowrap">Market</th>
              <th className="px-4 py-3 whitespace-nowrap">Side / Type</th>
              <th className="px-4 py-3 whitespace-nowrap text-right">
                Filled / Total
              </th>
              <th className="px-4 py-3 whitespace-nowrap text-right">
                Avg Price
              </th>
              <th className="px-4 py-3 whitespace-nowrap text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-sm font-medium text-neutral-700 dark:text-neutral-200">
            {data.map((item) => (
              <DesktopTradeRow key={item.id} item={item} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Sub-Components ---

function DesktopTradeRow({ item }: { item: Trade }) {
  const dateObj = new Date(item.createdAt);

  return (
    <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors group">
      {/* TIME */}
      <td className="px-4 py-2 whitespace-nowrap">
        <div className="flex flex-col">
          <span className="text-xs font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
            {dateObj.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
          <span className="text-[10px] text-neutral-500 tabular-nums">
            {dateObj.toLocaleTimeString()}
          </span>
        </div>
      </td>

      {/* MARKET */}
      <td className="px-4 py-2 whitespace-nowrap">
        <span className="font-bold text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-neutral-700 dark:text-neutral-300">
          {item.pair.symbol}
        </span>
      </td>

      {/* SIDE & TYPE */}
      <td className="px-4 py-2 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <SideBadge side={item.side} />
          <span className="text-[12px] font-bold text-neutral-400 uppercase tracking-wide">
            {item.type}
          </span>
        </div>
      </td>

      {/* QUANTITY */}
      <td className="px-4 py-2 whitespace-nowrap text-right ">
        <div className="flex items-center gap-2 justify-end">
          <div className="text-xs tabular-nums text-neutral-900 dark:text-neutral-100">
            {item.filledQty.toLocaleString()}
          </div>
          <div className="text-[10px] text-neutral-400 tabular-nums">
            / {item.quantity.toLocaleString()}
          </div>
        </div>
      </td>

      {/* PRICE */}
      <td className="px-4 py-2 whitespace-nowrap text-right">
        <div className="text-xs font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
          {(item.avgFillPrice > 0
            ? item.avgFillPrice
            : item.price
          )?.toLocaleString(undefined, {
            minimumFractionDigits: item.pair.pricePrecision,
            maximumFractionDigits: item.pair.pricePrecision,
          })}
        </div>
        <span className="text-[9px] text-neutral-400 uppercase">USDT</span>
      </td>

      {/* STATUS */}
      <td className="px-4 py-2 whitespace-nowrap text-right">
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={item.status} />
          {item.status === "FAILED" && item.errorMessage && (
            <div className="text-[10px] text-rose-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity truncate max-w-[120px]">
              {item.errorMessage.split(":").pop()?.replace(/"/g, "") || "Error"}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

function MobileTradeCard({ item }: { item: Trade }) {
  return (
    <div className="p-4 flex flex-col gap-3">
      {/* Header: Market, Side, Time */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-neutral-900 dark:text-white">
            {item.pair.symbol}
          </span>
          <SideBadge side={item.side} />
        </div>
        <div className="text-right">
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            {new Date(item.createdAt).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Middle: Data Grid */}
      <div className="grid grid-cols-2 gap-y-2 text-sm">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase text-neutral-500 font-bold">
            Price
          </span>
          <span className="tabular-nums text-neutral-800 dark:text-neutral-200">
            {(item.avgFillPrice > 0
              ? item.avgFillPrice
              : item.price
            )?.toLocaleString(undefined, {
              minimumFractionDigits: item.pair.pricePrecision,
            })}
          </span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[10px] uppercase text-neutral-500 font-bold">
            Filled / Qty
          </span>
          <span className="tabular-nums text-neutral-800 dark:text-neutral-200">
            {item.filledQty}{" "}
            <span className="text-neutral-400">/ {item.quantity}</span>
          </span>
        </div>
      </div>

      {/* Footer: Status */}
      <div className="flex justify-between items-center pt-2 border-t border-neutral-100 dark:border-neutral-800/50">
        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
          {item.type}
        </span>
        <StatusBadge status={item.status} />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    FILLED:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30",
    CANCELED:
      "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700",
    FAILED:
      "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200 dark:border-rose-500/30",
    OPEN: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/30",
    PENDING:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
  };

  const defaultStyle = styles.CANCELED;

  return (
    <span
      className={`
        text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide border 
        ${styles[status] || defaultStyle}
      `}
    >
      {status}
    </span>
  );
}
