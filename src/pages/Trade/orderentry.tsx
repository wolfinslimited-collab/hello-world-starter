import React, { useState, useEffect, useMemo } from "react";
import { PlusCircle, AlertCircle } from "lucide-react";
import { clsx } from "clsx";
import { useTradeStore } from "./component/store";
import useStorage from "context";
import { useWallet } from "hooks/use-query";
import { toMoney } from "utils/helper";
import Modal from "components/specific/modal";
import Transfer from "pages/Wallet/transfer";
import { toast } from "react-toastify";
import { json } from "utils/request";

const OrderEntry = () => {
  // --- Store Data ---
  const {
    app: { wallet: wallets },
    setting: { token, isLoged },
  } = useStorage();
  const { fetchWallet } = useWallet();
  const { symbol, lastPrice, emitEvent } = useTradeStore(); // Live data
  const [loading, setLoading] = useState(false);

  // --- Local State ---
  const [activeTab, setActiveTab] = useState<
    "LIMIT" | "MARKET" | "STOP_MARKET"
  >("LIMIT");
  const [orderSide, setOrderSide] = useState<"BUY" | "SELL">("BUY"); // Used for Spot UI logic

  // Inputs
  const [price, setPrice] = useState<string>("");
  const [stopPrice, setStopPrice] = useState<string>("");
  const [amount, setAmount] = useState<string>(""); // Now represents Quote Value (e.g. USDT)
  const [leverage, setLeverage] = useState<number>(1);
  const [sliderVal, setSliderVal] = useState(0);

  // Options
  const [isTpSl, setIsTpSl] = useState(false);
  const [isReduceOnly, setIsReduceOnly] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  // --- Derived Data & Logic ---
  const isSpot = symbol?.type === "SPOT";
  const currentPrice = Number(activeTab === "MARKET" ? lastPrice : price) || 0;

  // 1. Initialize Price with LastPrice when symbol changes
  useEffect(() => {
    if (lastPrice && !price) setPrice(lastPrice.toString());
  }, [lastPrice, symbol?.symbol]);

  // 2. Find Correct Wallet Asset
  // If Spot & Sell -> We need Base Asset (e.g. BTC)
  // If Spot & Buy -> We need Quote Asset (e.g. USDT)
  // If Perpetual   -> We need Margin Asset (usually Quote/USDT)
  const targetAssetSymbol =
    isSpot && orderSide === "SELL" ? symbol?.base : symbol?.quote;

  const activeWallet = useMemo(() => {
    return wallets?.find((w: any) => w.asset.symbol === targetAssetSymbol);
  }, [wallets, targetAssetSymbol]);

  const balance = activeWallet?.balance || 0;

  // 3. Calculation & Validation
  const calculatedLeverage = isSpot ? 1 : leverage;

  // Helper: Convert the Quote Input to Base Units for logic checks (Prevent / 0)
  const quantityInBase = currentPrice > 0 ? Number(amount) / currentPrice : 0;

  const requiredMargin =
    isSpot && orderSide === "SELL"
      ? quantityInBase // For Spot Sell: We need enough Base Asset
      : Number(amount) / calculatedLeverage; // For Buy/Perp: We need enough Quote (margin)

  const isInsufficientBalance = requiredMargin > balance;
  const isZeroBalance = balance === 0;

  // --- Handlers ---
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = Number(e.target.value);
    setSliderVal(percent);

    if (currentPrice <= 0) return;

    let maxQuoteAmount = 0;

    if (isSpot && orderSide === "SELL") {
      // Spot Sell: Max Quote Value = Balance (Base) * Price
      maxQuoteAmount = balance * currentPrice;
    } else {
      // Buy/Long/Short: Max Quote Value = Balance (Quote) * Leverage
      maxQuoteAmount = balance * calculatedLeverage;
    }

    const calculatedAmount = maxQuoteAmount * (percent / 100);

    // Formatting: Quote asset usually 2 decimals (or use symbol precision)
    setAmount(calculatedAmount > 0 ? calculatedAmount.toFixed(2) : "");
  };

  const handleSubmit = async (side: "BUY" | "SELL") => {
    if (isSpot) setOrderSide(side);
    if (!isLoged) return;
    if (!amount || Number(amount) <= 0) {
      return toast.error("Please enter an amount");
    }
    if (activeTab !== "MARKET" && (!price || Number(price) <= 0)) {
      return toast.error("Please enter a valid price");
    }
    if (isInsufficientBalance) {
      return toast.error("Insufficient balance");
    }

    const executionPrice = activeTab === "MARKET" ? lastPrice : Number(price);

    const payload = {
      userId: activeWallet?.userId || 1,
      pair: symbol?.id,
      type: activeTab === "STOP_MARKET" ? "STOP" : activeTab,
      side: side,
      quantity: (Number(amount) / executionPrice).toFixed(4),
      price: activeTab === "MARKET" ? undefined : Number(price),
      leverage: calculatedLeverage,
      stopPrice: activeTab === "STOP_MARKET" ? Number(stopPrice) : undefined,
    };

    setLoading(true);
    console.log("🚀 Submitting Order:", payload);

    const res: any = await json("trade/order", payload, { token });

    setLoading(false);
    if (res.success) {
      setAmount("");
      setSliderVal(0);
      toast.success(`${side} Order placed successfully!`);
      fetchWallet();
      emitEvent(symbol?.type === "SPOT" ? "order" : "position", {});
    } else {
      const errorMsg = res?.data?.message || "Order failed. Try again.";
      toast.error(errorMsg);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/3 dark:bg-white/7 rounded-md p-3 w-full">
      {/* --- Top Tabs --- */}
      <div className="flex gap-4 text-sm font-medium text-neutral-400 border-b border-white/5 mb-4">
        {["LIMIT", "MARKET", "STOP_MARKET"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={clsx(
              "py-2  transition-colors",
              activeTab === tab
                ? "text-black dark:text-white"
                : "text-neutral-500 dark:text-neutral-400 "
            )}
          >
            {tab === "STOP_MARKET"
              ? "Stop Limit"
              : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* --- Balance Display --- */}
      <div className="space-y-4 flex-1">
        <div className="flex justify-between items-center text-[11px] text-neutral-500">
          <span className="flex items-center gap-1">
            Avbl{" "}
            <span className="text-black dark:text-white font-bold">
              {toMoney(balance)} {targetAssetSymbol}
            </span>
            <Modal
              trigger={
                <div className="">
                  <PlusCircle
                    strokeWidth={1}
                    className="text-black dark:text-white size-4 cursor-pointer"
                  />
                </div>
              }
            >
              <Transfer asset={symbol?.quoteAsset} modalType={"deposit"} />
            </Modal>
          </span>
        </div>

        {/* --- Inputs --- */}
        <div className="space-y-4">
          {/* Stop Price */}
          {activeTab === "STOP_MARKET" && (
            <InputField
              label="Stop"
              value={stopPrice}
              onChange={setStopPrice}
              suffix={symbol?.quote}
              placeholder="Trigger Price"
            />
          )}

          {/* Price */}
          <InputField
            label="Price"
            value={activeTab === "MARKET" ? "Market Price" : price}
            onChange={setPrice}
            disabled={activeTab === "MARKET"}
            suffix={activeTab !== "MARKET" && symbol?.quote}
            type={activeTab === "MARKET" ? "text" : "number"}
          />

          {/* Quantity (Now Size in Quote) */}
          <InputField
            label="Size"
            value={amount}
            onChange={(val: string) => {
              setAmount(val);
              // Reset slider if manual input doesn't match math (optional)
              setSliderVal(0);
            }}
            suffix={symbol?.quote} // CHANGED: Now shows Quote (e.g. USDT)
            placeholder={`Min ${symbol?.quote}`} // CHANGED: Placeholder matches suffix
            error={isInsufficientBalance}
          />

          {/* Percentage Slider */}
          <div className="pt-2 pb-1 relative group relative flex items-center">
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={sliderVal}
              onChange={handleSliderChange}
              className="w-full h-2 bg-neutral-400 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-neutral-700 dark:accent-white relative z-10"
            />
            <div className="flex justify-between  absolute inset-x-0 ">
              {[0, 25, 50, 75, 100].map((step) => (
                <div
                  key={step}
                  className={`w-2 h-3 rounded-full ${
                    sliderVal >= step
                      ? "bg-neutral-400 dark:bg-neutral-700"
                      : "bg-neutral-400 dark:bg-neutral-700"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Leverage Slider (Perp Only) */}
          {!isSpot && (
            <div className="bg-black/5 dark:bg-white/5 rounded px-3 py-2 border border-transparent hover:border-neutral-500">
              <div className="flex justify-between text-xs text-neutral-400 mb-2">
                <span>Leverage</span>
                <span className="text-black dark:text-white font-bold">
                  {leverage}x
                </span>
              </div>
              <div className="pt-2 pb-1 relative group relative flex items-center">
                <input
                  type="range"
                  min="1"
                  max="200"
                  step="1"
                  value={leverage}
                  onChange={(e) => setLeverage(Number(e.target.value))}
                  className="w-full h-2 bg-neutral-400 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-neutral-700 dark:accent-white relative z-10"
                />
                <div className="flex justify-between  absolute inset-x-0 ">
                  {[0, 25, 50, 75, 100].map((step) => (
                    <div
                      key={step}
                      className={`w-2 h-3 rounded-full ${
                        sliderVal >= step
                          ? "bg-neutral-400 dark:bg-neutral-700"
                          : "bg-neutral-400 dark:bg-neutral-700"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* --- Options --- */}
        <div className="flex flex-wrap gap-x-4 gap-y-2 py-1">
          <CheckBox label="TP/SL" checked={isTpSl} onChange={setIsTpSl} />
          {!isSpot && (
            <CheckBox
              label="Hidden"
              checked={isHidden}
              onChange={setIsHidden}
            />
          )}
          <CheckBox
            label="Reduce-Only"
            checked={isReduceOnly}
            onChange={setIsReduceOnly}
          />
        </div>

        {/* --- Action Area --- */}
        <div className="mt-4">
          {isZeroBalance ? (
            <Modal
              trigger={
                <button className="w-full bg-orange-300 text-black font-bold py-3 rounded text-sm hover:bg-orange-300/90 transition-all flex items-center justify-center gap-2">
                  <PlusCircle size={16} /> Deposit Funds
                </button>
              }
            >
              <Transfer asset={symbol?.quoteAsset} modalType={"deposit"} />
            </Modal>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => handleSubmit("BUY")}
                disabled={
                  loading || (isInsufficientBalance && orderSide === "BUY")
                }
                className="flex-1 bg-[#2ebd85] hover:bg-[#34d399] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded text-sm transition-all flex items-center justify-center gap-2"
              >
                {loading && orderSide === "BUY" ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isSpot ? (
                  "Buy"
                ) : (
                  "Buy / Long"
                )}
              </button>

              <button
                onClick={() => handleSubmit("SELL")}
                disabled={
                  loading || (isInsufficientBalance && orderSide === "SELL")
                }
                className="flex-1 bg-[#f6465d] hover:bg-[#ff5a70] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded text-sm transition-all flex items-center justify-center gap-2"
              >
                {loading && orderSide === "SELL" ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : isSpot ? (
                  "Sell"
                ) : (
                  "Sell / Short"
                )}
              </button>
            </div>
          )}
          {/* Inline Error Handling (No Alerts) */}
          {isInsufficientBalance && !isZeroBalance && (
            <div className="flex items-center gap-2 text-[#f6465d] bg-[#f6465d]/10 p-2 rounded mt-3 text-[11px] justify-center animate-pulse border border-[#f6465d]/20">
              <AlertCircle size={12} />
              <span>Insufficient Balance for this trade</span>
            </div>
          )}
        </div>

        {/* --- Footer Info (Dynamic based on logic) --- */}
        <div className="border-t border-white/5 pt-3 space-y-1">
          {!isSpot && (
            <>
              <div className="flex justify-between text-[11px] text-neutral-500">
                <span>Liq. Price</span>
                <span className="text-white">--</span>
              </div>
              <div className="flex justify-between text-[11px] text-neutral-500">
                <span>Margin Cost</span>
                <span
                  className={clsx(
                    isInsufficientBalance ? "text-[#f6465d]" : "text-white"
                  )}
                >
                  {/* Amount is already in Quote */}
                  {Number(amount || 0).toFixed(2)} {symbol?.quote}
                </span>
              </div>
            </>
          )}
          <div className="flex justify-between text-[11px] text-neutral-500">
            <span>Max Size</span>
            <span className="text-white">
              {/* Max Size calculated in Quote Terms */}
              {(isSpot && orderSide === "SELL"
                ? balance * currentPrice
                : balance * calculatedLeverage
              ).toFixed(2)}{" "}
              {symbol?.quote}
            </span>
          </div>
          <div className="flex justify-between text-[11px] text-neutral-500 border-b border-dashed border-neutral-700 pb-0.5 w-fit">
            <span>Trading Fee</span>
            <span className="ml-2 text-white">0.04%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const InputField = ({
  label,
  value,
  onChange,
  suffix,
  type = "number",
  disabled = false,
  placeholder,
  error,
}: any) => (
  <div
    className={clsx(
      "bg-black/5 dark:bg-white/5 rounded px-3 py-2 flex items-center justify-between border transition-colors",
      error
        ? "border-red-500/50"
        : "border-transparent hover:border-neutral-500 focus-within:border-black dark:focus-within:border-white"
    )}
  >
    <span className="text-xs text-neutral-600  dark:text-neutral-400 min-w-[60px]">
      {label}
    </span>
    <div className="flex items-center flex-1 justify-end gap-2">
      <input
        type={type}
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        className="bg-transparent text-center text-sm font-bold text-black dark:text-white w-full outline-none placeholder:text-neutral-500 appearance-none disabled:cursor-not-allowed"
      />
      {suffix && <span className="text-xs text-neutral-500">{suffix}</span>}
    </div>
  </div>
);

const CheckBox = ({ label, checked, onChange }: any) => (
  <label className="flex items-center gap-2 cursor-pointer group select-none">
    <div
      className={clsx(
        "w-3 h-3 rounded border flex items-center justify-center transition-colors",
        checked
          ? "bg-black dark:bg-white border-black dark:bg-white dark:border-white"
          : "border-neutral-500 group-hover:border-neutral-600 bg-transparent"
      )}
    >
      {checked && (
        <div className="w-1.5 h-1.5 bg-white dark:bg-black rounded-sm" />
      )}
    </div>
    <span className="text-[11px] text-neutral-400 group-hover:text-neutral-500">
      {label}
    </span>
    <input
      type="checkbox"
      className="hidden"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
  </label>
);

export default OrderEntry;
