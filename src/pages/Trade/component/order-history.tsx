import React, { useState } from "react";
import {
  List,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  X,
} from "lucide-react";
import { EmptyUI, LoadingUI } from "./utils";

// --- Types (Based on your JSON) ---
interface Order {
  id: number;
  userId: number;
  pairId: number;
  side: "BUY" | "SELL";
  type: "LIMIT" | "MARKET" | string;
  price: number;
  quantity: number;
  filledQty: number;
  status: string;
  createdAt: string;
  pair: {
    symbol: string;
    base: string;
    quote: string;
    pricePrecision: number;
    quantityPrecision: number;
  };
}

interface OrdersListProps {
  data?: Order[];
  loading?: boolean;
  onAction: (orderId: number) => void | Promise<void>;
  actionLoading: boolean;
}

// --- Main Component ---
export default function OrdersList({
  data,
  loading,
  onAction,
  actionLoading,
}: OrdersListProps) {
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);

  // Handle the confirmation logic
  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;

    try {
      await onAction(orderToCancel.id);
      setOrderToCancel(null); // Close modal on success
    } catch (err) {
      console.error("Failed to cancel", err);
    }
  };

  if (loading) return <LoadingUI message="Syncing Orderbook" />;

  if (!data?.length) {
    return (
      <EmptyUI
        icon={<List size={48} />}
        title="No Open Orders"
        subtitle="Place a limit or market order to see it here."
      />
    );
  }

  return (
    <>
      <div className="w-full overflow-hidden">
        {/* Mobile View (Cards) */}
        <div className="block md:hidden divide-y divide-neutral-100 dark:divide-neutral-800">
          {data.map((order) => (
            <MobileOrderCard
              key={order.id}
              order={order}
              onCancel={() => setOrderToCancel(order)}
            />
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
                <th className="px-4 py-3 whitespace-nowrap">
                  Price / Progress
                </th>
                <th className="px-4 py-3 whitespace-nowrap text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-sm font-medium text-neutral-700 dark:text-neutral-200">
              {data.map((order) => (
                <DesktopOrderRow
                  key={order.id}
                  order={order}
                  onCancel={() => setOrderToCancel(order)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {orderToCancel && (
        <CancelConfirmModal
          order={orderToCancel}
          isOpen={!!orderToCancel}
          isProcessing={actionLoading}
          onClose={() => setOrderToCancel(null)}
          onConfirm={handleConfirmCancel}
        />
      )}
    </>
  );
}

// --- Sub-Components ---

function DesktopOrderRow({
  order,
  onCancel,
}: {
  order: Order;
  onCancel: () => void;
}) {
  const percentFilled = Math.min((order.filledQty / order.quantity) * 100, 100);

  return (
    <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors group">
      {/* Time */}
      <td className="px-4 py-2 whitespace-nowrap">
        <span className="text-[11px] text-neutral-400 tabular-nums">
          {new Date(order.createdAt).toLocaleTimeString()}
        </span>
      </td>

      {/* Market */}
      <td className="px-4 py-2 whitespace-nowrap">
        <span className="font-bold text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-neutral-700 dark:text-neutral-300">
          {order.pair.symbol}
        </span>
      </td>

      {/* Side / Type */}
      <td className="px-4 py-2 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <SideBadge side={order.side} />
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">
            {order.type}
          </span>
        </div>
      </td>

      {/* Price & Progress */}
      <td className="px-4 py-2 whitespace-nowrap">
        <div className="flex flex-col gap-1.5 w-32">
          <div className="flex justify-between items-end">
            <span className="text-xs font-bold tabular-nums">
              {order.price.toLocaleString(undefined, {
                minimumFractionDigits: order.pair.pricePrecision,
              })}
            </span>
            <span className="text-[9px] text-neutral-400">
              {percentFilled.toFixed(1)}%
            </span>
          </div>
          {/* Progress Bar */}
          <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ease-out ${
                order.side === "BUY" ? "bg-emerald-500" : "bg-rose-500"
              }`}
              style={{ width: `${percentFilled}%` }}
            />
          </div>
          <div className="text-[9px] text-neutral-400 tabular-nums text-right">
            {order.filledQty} / {order.quantity} {order.pair.base}
          </div>
        </div>
      </td>

      {/* Cancel Button */}
      <td className="px-4 py-2 whitespace-nowrap text-right">
        <button
          onClick={onCancel}
          className="p-2 text-neutral-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
          title="Cancel Order"
        >
          <Trash2 size={16} />
        </button>
      </td>
    </tr>
  );
}

function MobileOrderCard({
  order,
  onCancel,
}: {
  order: Order;
  onCancel: () => void;
}) {
  const percentFilled = Math.min((order.filledQty / order.quantity) * 100, 100);

  return (
    <div className="p-4 flex flex-col gap-3">
      {/* Top Row */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-neutral-900 dark:text-white">
            {order.pair.symbol}
          </span>
          <SideBadge side={order.side} />
        </div>
        <span className="text-[10px] text-neutral-400">
          {new Date(order.createdAt).toLocaleTimeString()}
        </span>
      </div>

      {/* Middle Row: Price & Progress */}
      <div className="p-3 border border-neutral-200 dark:border-neutral-800 rounded-md">
        <div className="flex justify-between mb-2">
          <span className="text-xs text-neutral-500">Price</span>
          <span className="text-sm font-bold tabular-nums">
            {order.price.toLocaleString(undefined, {
              minimumFractionDigits: order.pair.pricePrecision,
            })}
            <span className="text-[10px] text-neutral-400 ml-1">
              {order.pair.quote}
            </span>
          </span>
        </div>

        {/* Progress Bar Area */}
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                order.side === "BUY" ? "bg-emerald-500" : "bg-rose-500"
              }`}
              style={{ width: `${percentFilled}%` }}
            />
          </div>
          <span className="text-[10px] text-neutral-500">
            {percentFilled.toFixed(0)}%
          </span>
        </div>
        <div className="text-right mt-1 text-[10px] text-neutral-400 ">
          {order.filledQty} / {order.quantity} {order.pair.base}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <span className="text-[12px] font-bold text-neutral-400 uppercase tracking-wider">
          {order.type}
        </span>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 rounded-md transition-colors"
        >
          <Trash2 size={12} />
          Cancel
        </button>
      </div>
    </div>
  );
}

// --- Modal Component ---

function CancelConfirmModal({
  order,
  isOpen,
  onClose,
  onConfirm,
  isProcessing,
}: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/10 dark:bg-black/10 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative animate-fade-up w-full max-w-sm bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-6 scale-100 transition-all">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center gap-4">
          <div className="p-3 bg-rose-100 dark:bg-rose-500/10 rounded-full text-rose-600 dark:text-rose-500">
            <AlertTriangle size={32} />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
              Cancel Order?
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-[240px] mx-auto">
              Are you sure you want to cancel your
              <span className="font-bold text-neutral-800 dark:text-neutral-200 mx-1">
                {order.side}
              </span>
              order for
              <span className="font-bold text-neutral-800 dark:text-neutral-200 mx-1">
                {order.pair.symbol}
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
              Keep Order
            </button>
            <button
              onClick={onConfirm}
              disabled={isProcessing}
              className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-rose-400 hover:bg-rose-500 rounded-lg shadow-sm shadow-rose-500/20 transition-all flex justify-center items-center gap-2"
            >
              {isProcessing ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Yes, Cancel"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Helpers ---

function SideBadge({ side }: { side: string }) {
  const isBuy = side === "BUY" || side === "LONG";
  return (
    <span
      className={`inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded border ${
        isBuy
          ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
          : "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400"
      }`}
    >
      {isBuy ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
      {side}
    </span>
  );
}
