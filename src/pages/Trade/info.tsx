import { Fragment, useEffect, useMemo, useState, useRef } from "react";
import {
  Menu,
  MenuButton,
  MenuItems,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
  Transition,
} from "@headlessui/react";
import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Note: Using native fetch for external APIs (not get utility which routes through edge function)
import useStorage from "context";
import { useTradeStore } from "./component/store";
import { formatNumber, toMoney } from "utils/helper";

type Ticker24h = {
  lastPrice: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  quoteVolume: string;
  volume: string;
};

export default function HeaderInfo() {
  const navigate = useNavigate();
  const { symbol, lastPrice } = useTradeStore();
  const {
    app: { pairs = [] },
  } = useStorage();

  const [ticker, setTicker] = useState<Ticker24h | null>(null);

  const BASE_API =
    symbol?.type === "SPOT"
      ? `https://sapi.asterdex.com/api/v1`
      : `https://www.asterdex.com/fapi/v1`;

  /* ---------------- Fetch ticker ---------------- */
  const fetchTicker = async () => {
    // Defensive check - ensure symbol and externalSymbol exist
    if (!symbol?.externalSymbol) return;
    
    try {
      // Use native fetch for external API (not the get utility which routes through edge function)
      const response = await fetch(
        `${BASE_API}/ticker/24hr?symbol=${symbol.externalSymbol}`
      );
      if (!response.ok) {
        throw new Error(`Ticker fetch failed: ${response.status}`);
      }
      const res: Ticker24h = await response.json();
      setTicker(res);
    } catch (error) {
      console.error("Failed to fetch ticker", error);
    }
  };

  // Initial fetch and Polling every 10s to keep volume/rolling window fresh
  useEffect(() => {
    if (!symbol?.externalSymbol) return;
    
    fetchTicker();

    const interval = setInterval(fetchTicker, 10000);
    return () => clearInterval(interval);
  }, [symbol?.externalSymbol]);

  /* ---------------- Derived Real-time Stats ---------------- */
  // We calculate live stats based on the socket `lastPrice` vs the `ticker` snapshot
  const stats = useMemo(() => {
    if (!ticker) return null;

    const tickerLast = parseFloat(ticker.lastPrice || "0");
    const tickerHigh = parseFloat(ticker.highPrice || "0");
    const tickerLow = parseFloat(ticker.lowPrice || "0");
    const tickerChangeP = parseFloat(ticker.priceChangePercent || "0");

    // 1. Determine the effective current price
    // If we have a live socket price, use it; otherwise use ticker price
    const currentPrice = lastPrice > 0 ? lastPrice : tickerLast;

    // 2. Calculate the implied 24h Open Price from the snapshot
    // Formula: Open = Last / (1 + change%/100)
    const openPrice = tickerLast / (1 + tickerChangeP / 100);

    // 3. Calculate Live Change %
    const liveChangePercent =
      openPrice === 0 ? 0 : ((currentPrice - openPrice) / openPrice) * 100;

    // 4. Calculate Live High/Low (expand bounds if current price breaks them)
    const liveHigh = Math.max(tickerHigh, currentPrice);
    const liveLow = Math.min(tickerLow, currentPrice);

    return {
      price: currentPrice,
      changePercent: liveChangePercent,
      high: liveHigh,
      low: liveLow,
      volQuote: ticker.quoteVolume,
      volBase: ticker.volume,
    };
  }, [ticker, lastPrice]);

  /* ---------------- Derived Helpers ---------------- */
  const isPositive = (stats?.changePercent ?? 0) >= 0;

  const spotPairs = useMemo(
    () => pairs.filter((p: any) => p.type === "SPOT"),
    [pairs]
  );

  const perpPairs = useMemo(
    () => pairs.filter((p: any) => p.type === "PERPETUAL"),
    [pairs]
  );

  if (!symbol) return null;

  /* ---------------- UI ---------------- */
  return (
    <header className="flex gap-4 items-center justify-between px-4 bg-black/3 dark:bg-white/7 rounded-md">
      {/* LEFT */}
      <div className="flex items-center gap-6">
        {/* Pair selector */}
        <PairDropdown spotPairs={spotPairs} perpPairs={perpPairs} />

        {/* Price */}
        <div className="flex flex-col text-nowrap ">
          <span
            className={`text-lg font-bold  ${
              isPositive ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {stats ? toMoney(stats.price) : "--"}
          </span>
          <span className="text-[11px] text-neutral-400">
            ≈ ${stats?.price ? toMoney(stats.price) : "--"}
          </span>
        </div>
      </div>

      {/* RIGHT STATS */}
      <div className="flex items-center gap-6 overflow-auto py-2">
        <Stat
          label="24h Change"
          value={`${stats ? stats.changePercent.toFixed(2) : "--"}%`}
          positive={isPositive}
        />
        <Stat label="24h High" value={toMoney(stats?.high)} />
        <Stat label="24h Low" value={toMoney(stats?.low)} />
        <Stat
          label={`24h Vol (${symbol.quote})`}
          value={formatNumber(Number(stats?.volQuote))}
        />
        <Stat
          label={`24h Vol (${symbol.base})`}
          value={formatNumber(Number(stats?.volBase))}
        />
      </div>
    </header>
  );
}

/* ========================================================= */
/* ================== Pair Dropdown ======================== */
/* ========================================================= */

function PairDropdown({
  spotPairs,
  perpPairs,
}: {
  spotPairs: any[];
  perpPairs: any[];
}) {
  const navigate = useNavigate();
  const { symbol } = useTradeStore();

  const onSelect = (pair: any) => {
    navigate(`/trade/${pair.type.toLowerCase()}/${pair.symbol}`);
  };

  const baseLogo = symbol?.baseAsset?.logo || '/logo.png';
  const quoteLogo = symbol?.quoteAsset?.logo || '/logo.png';

  return (
    <Menu as="div" className="relative text-black dark:text-white flex ">
      <MenuButton className="flex items-center gap-2 hover:bg-white/5 px-2 py-1 rounded">
        <div className="flex relative items-end">
          <img src={baseLogo} className="w-10 min-w-10 rounded" alt={symbol?.base || 'Base'} />
          <img src={quoteLogo} className="h-6 min-h-6 -ms-3" alt={symbol?.quote || 'Quote'} />
        </div>

        <div className="flex flex-col items-start ps-4">
          <div className="font-semibold text-nowrap">{symbol?.symbol || '--'}</div>
          <div className="-mt-2">
            <span className="text-[10px] bg-black/10 dark:bg-white/10 px-1 rounded">
              {symbol?.type === "PERPETUAL" ? "Perp" : "Spot"}
            </span>
          </div>
        </div>
        <ChevronDown size={14} />
      </MenuButton>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <MenuItems className="absolute z-50 mt-14 w-[320px] rounded-md bg-neutral-900 dark:bg-neutral-800 shadow-lg outline-none border border-white/10">
          <TabGroup>
            <TabList className="flex border-b border-white/10">
              <Tab className={tabClass}>Spot</Tab>
              <Tab className={tabClass}>Perpetual</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                <PairList pairs={spotPairs} onSelect={onSelect} />
              </TabPanel>
              <TabPanel>
                <PairList pairs={perpPairs} onSelect={onSelect} />
              </TabPanel>
            </TabPanels>
          </TabGroup>
        </MenuItems>
      </Transition>
    </Menu>
  );
}

function PairList({
  pairs,
  onSelect,
}: {
  pairs: any[];
  onSelect: (p: any) => void;
}) {
  if (!pairs || pairs.length === 0) {
    return (
      <div className="p-4 text-center text-neutral-400 text-sm">
        No pairs available
      </div>
    );
  }

  return (
    <div className="max-h-[300px] overflow-y-auto">
      {pairs.map((p) => (
        <Menu.Item key={p.id}>
          {({ active }) => (
            <button
              onClick={() => onSelect(p)}
              className={`flex items-center gap-2 w-full px-3 py-2 text-sm ${
                active ? "bg-white/10" : ""
              }`}
            >
              <img 
                src={p.baseAsset?.logo || '/logo.png'} 
                className="size-5 rounded" 
                alt={p.base || 'Asset'}
              />
              <span>{p.symbol || '--'}</span>
            </button>
          )}
        </Menu.Item>
      ))}
    </div>
  );
}

/* ========================================================= */
/* ====================== Helpers ========================== */
/* ========================================================= */

function Stat({
  label,
  value,
  positive,
}: {
  label: string;
  value?: string;
  positive?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-[10px] text-nowrap text-neutral-600 dark:text-neutral-400">
        {label}
      </div>
      <div
        className={`text-xs text-nowrap  ${
          positive === undefined
            ? "text-neutral-900 dark:text-neutral-100"
            : positive
            ? "text-emerald-400"
            : "text-rose-400"
        }`}
      >
        {value ?? "--"}
      </div>
    </div>
  );
}

const tabClass = ({ selected }: any) =>
  `flex-1 py-2 text-sm ${
    selected
      ? "ext-black dark:text-white"
      : "text-neutral-500 dark:text-neutral-400"
  }`;
