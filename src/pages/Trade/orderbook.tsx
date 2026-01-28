import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useTradeStore } from "./component/store";
import clsx from "clsx";
import { get } from "utils/request";
import { ArrowUpIcon, ChevronDownIcon } from "lucide-react";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";

/* ---------------- Config ---------------- */
const MAX_ROWS = 80;
const TRADE_HISTORY_SIZE = 80;

/* ---------------- Types ---------------- */
type DepthTuple = [string, string]; // [Price, Size]

type Trade = {
  id: number;
  price: number;
  qty: number;
  time: number;
  isBuyerMaker: boolean; // true = Sell (Red), false = Buy (Green)
};

type ViewMode = "all" | "bids" | "asks";
type Tab = "orderbook" | "trades";

/* ---------------- Helpers ---------------- */

// Helper to update the map with new depth data
const updateMap = (map: Map<string, number>, updates: [string, string][]) => {
  updates.forEach(([p, q]) => {
    const size = parseFloat(q);
    if (size === 0) {
      map.delete(p);
    } else {
      map.set(p, size);
    }
  });
};

// Helper hook to calculate cumulative depth for the UI
const useCumulativeDepth = (orders: DepthTuple[]) => {
  return useMemo(() => {
    let cumulative = 0;
    return orders.map(([price, size]) => {
      const s = parseFloat(size);
      cumulative += s;
      return { price, size: s, total: cumulative, ...orders }; // Spread to keep structure if needed, or return simplified object
    });
  }, [orders]);
};

export default function OrderBook() {
  const { symbol, setLastPrice, lastPrice } = useTradeStore();

  const WS_URL =
    symbol?.type === "SPOT"
      ? `wss://sstream.asterdex.com/stream`
      : `wss://fstream.asterdex.com/stream`;

  const BASE_API =
    symbol?.type === "SPOT"
      ? `https://sapi.asterdex.com/api/v1`
      : `https://www.asterdex.com/fapi/v1`;

  // -- UI State
  const [activeTab, setActiveTab] = useState<Tab>("orderbook");
  const [viewMode, setViewMode] = useState<ViewMode>("all");

  // -- Grouping Logic

  // Fix: Improved normalize to handle floating point precision issues better
  const normalize = (n: number) => {
    if (n === 0) return 0;
    const precision = 100000000;
    return Math.round(n * precision) / precision;
  };

  // Fix: Generate groups based on Symbol Precision first, then Last Price
  const generateGroups = useCallback(
    (currentLastPrice: number, currentSymbol: any): number[] => {
      // 1. Try to use Symbol Precision (Most Accurate and Stable)
      if (currentSymbol?.pricePrecision) {
        const step = Math.pow(10, -currentSymbol.pricePrecision);
        // Generate steps: 1x, 10x, 100x, 1000x, 10000x (e.g., 0.00001, 0.0001, 0.001...)
        return [step, step * 10, step * 100, step * 1000, step * 10000].map(
          normalize
        );
      }

      // 2. Fallback to Last Price logic if symbol data isn't ready
      let price = currentLastPrice;
      if (!price || price <= 0) {
        // Fallback to symbol price if lastPrice store is empty
        if (currentSymbol?.baseAsset?.price)
          price = currentSymbol.baseAsset.price;
        else return [0.01, 0.1, 1, 10, 100]; // Safe fallback defaults
      }

      const magnitude = Math.pow(10, Math.floor(Math.log10(price)));
      const base = magnitude / 1000;
      const _base = [base * 0.01, base * 0.1, base, base * 5, base * 10];
      return _base.map((e) => normalize(e)).filter((e) => e > 0);
    },
    []
  );

  const [groups, setGroups] = useState<number[]>([]);
  // Fix: Initialize grouping to 0 (unset) so we don't default to '1' incorrectly
  const [grouping, setGrouping] = useState<number>(0);

  // Initialize and update groups when Symbol changes
  useEffect(() => {
    if (symbol) {
      const nextGroups = generateGroups(lastPrice || 0, symbol);
      setGroups(nextGroups);

      // Auto-select the finest grouping if current is not valid
      setGrouping((prev) => {
        if (prev > 0 && nextGroups.includes(prev)) return prev;
        return nextGroups[0];
      });
    }
  }, [symbol, lastPrice, generateGroups]);

  const getDecimals = (step: number) => {
    if (step >= 1) return 0;
    const log = Math.log10(step);
    return log < 0 ? Math.abs(Math.floor(log)) : 0;
  };

  const decimals = getDecimals(grouping || 1);

  // Raw maps store the exact API data (ungrouped) to prevent precision loss during regrouping
  const bidsMap = useRef<Map<string, number>>(new Map());
  const asksMap = useRef<Map<string, number>>(new Map());

  // These are the arrays rendered in the UI (grouped & sorted)
  const [bids, setBids] = useState<DepthTuple[]>([]);
  const [asks, setAsks] = useState<DepthTuple[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);

  // Helper to re-calculate the visible arrays based on current grouping
  const processOrderBook = useCallback(() => {
    // If grouping hasn't been set yet (is 0), skip processing to avoid division by zero or errors
    if (grouping === 0) return;

    const group = (map: Map<string, number>, type: "asc" | "desc") => {
      const groupedMap = new Map<number, number>();

      for (const [priceStr, size] of map.entries()) {
        const price = parseFloat(priceStr);
        if (isNaN(price)) continue;

        // Round based on grouping
        // e.g. Price 0.1286, Grouping 0.0001 -> Math.floor(1286) / 10000 -> 0.1286
        const g = grouping;
        const groupedPrice =
          g >= 1
            ? Math.floor(price / g) * g
            : Math.floor(price * (1 / g)) / (1 / g);

        // Fix floating point artifacts
        const finalPrice = normalize(groupedPrice);

        const existing = groupedMap.get(finalPrice) || 0;
        groupedMap.set(finalPrice, existing + size);
      }

      const res = Array.from(groupedMap.entries())
        .sort((a, b) => (type === "desc" ? b[0] - a[0] : a[0] - b[0])) // Bids Desc, Asks Asc
        .slice(0, MAX_ROWS)
        .map(([p, s]) => [p.toFixed(decimals), s.toString()] as DepthTuple);

      return res;
    };

    if (bidsMap.current) {
      setBids(group(bidsMap.current, "desc"));
      setAsks(group(asksMap.current, "asc"));
    }
  }, [grouping, decimals]);

  // Re-process when grouping changes
  useEffect(() => {
    processOrderBook();
  }, [grouping, processOrderBook]);

  /* ---------------- Initial Data Load ---------------- */
  useEffect(() => {
    if (!symbol?.externalSymbol) return;

    const fetchSnapshot = async () => {
      try {
        const sym = symbol.externalSymbol?.toUpperCase();
        if (!sym) return;

        // 1. Fetch Depth
        const depthData: any = await get(`${BASE_API}/depth?symbol=${sym}`);
        bidsMap.current.clear();
        asksMap.current.clear();

        if (depthData?.bids) {
          depthData.bids.forEach(([p, q]: string[]) =>
            bidsMap.current.set(p, parseFloat(q))
          );
        }
        if (depthData?.asks) {
          depthData.asks.forEach(([p, q]: string[]) =>
            asksMap.current.set(p, parseFloat(q))
          );
        }

        processOrderBook();

        // 2. Fetch Recent Trades
        const tradesData: Trade[] = await get(
          `${BASE_API}/aggTrades?symbol=${sym}&limit=${TRADE_HISTORY_SIZE}`
        );

        // Map API specific fields to our Trade type
        if (Array.isArray(tradesData)) {
          const formattedTrades: Trade[] = tradesData
            .map((t: any) => ({
              id: t.a,
              price: parseFloat(t.p),
              qty: parseFloat(t.q),
              time: t.T,
              isBuyerMaker: t.m,
            }))
            .reverse(); // Newest first

          setTrades(formattedTrades);
          if (formattedTrades.length > 0) {
            setLastPrice(formattedTrades[0].price);
          }
        }
      } catch (e) {
        console.error("Failed to load initial snapshot", e);
      }
    };

    fetchSnapshot();
  }, [symbol?.externalSymbol]);

  /* ---------------- WebSocket Logic ---------------- */
  useEffect(() => {
    if (!symbol?.externalSymbol) return;

    const symLower = symbol.externalSymbol?.toLowerCase();
    if (!symLower) return;

    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      const payload = {
        method: "SUBSCRIBE",
        params: [`${symLower}@aggTrade`, `${symLower}@depth`],
        id: 1,
      };
      ws.send(JSON.stringify(payload));
    };

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (!msg?.data) return;
      const eventType = msg.data.e;

      // --- Handle Trades ---
      if (eventType === "aggTrade") {
        const { p: price, q: qty, T: time, m: isBuyerMaker, a: id } = msg.data;
        const newPrice = parseFloat(price);

        // Update Store
        setLastPrice(newPrice);

        // Update Local List
        setTrades((prev) => {
          const newTrade: Trade = {
            id,
            price: newPrice,
            qty: parseFloat(qty),
            time,
            isBuyerMaker,
          };
          return [newTrade, ...prev].slice(0, TRADE_HISTORY_SIZE);
        });
      }

      // --- Handle Depth ---
      if (eventType === "depthUpdate") {
        const { b: bidUpdates, a: askUpdates } = msg.data;

        // Fix: Use the defined updateMap helper
        updateMap(bidsMap.current, bidUpdates);
        updateMap(asksMap.current, askUpdates);

        // We debounce or throttle this in real apps, but calling directly for responsiveness here
        processOrderBook();
      }
    };

    return () => ws.close();
  }, [symbol, setLastPrice, processOrderBook]);

  /* ---------------- Data Processing for UI ---------------- */

  // Fix: Use the defined helper hook
  const asksWithDepth = useCumulativeDepth(asks);
  const bidsWithDepth = useCumulativeDepth(bids);

  // Slicing for Fixed Views
  const limit = viewMode === "all" ? 13 : 24;

  // Note: We reverse asks for the 'all' view so the lowest price (spread) is at the bottom of the top block
  const visibleAsks =
    viewMode === "bids" ? [] : asksWithDepth.slice(0, limit).reverse();

  const visibleBids = viewMode === "asks" ? [] : bidsWithDepth.slice(0, limit);

  /* ---------------- Rendering ---------------- */

  return (
    <div className="flex flex-col w-full h-[640px]  text-xs select-none bg-black/3 dark:bg-white/7 rounded-md">
      {/* --- HEADER --- */}
      <div className="flex items-center gap-6 px-4 py-3 ">
        <button
          onClick={() => setActiveTab("orderbook")}
          className={clsx(
            "text-sm font-semibold transition-all  pb-3 -mb-3.5",
            activeTab === "orderbook"
              ? "text-black dark:text-white"
              : "text-neutral-500 dark:text-neutral-400 "
          )}
        >
          Order Book
        </button>
        <button
          onClick={() => setActiveTab("trades")}
          className={clsx(
            "text-sm font-semibold transition-all  pb-3 -mb-3.5",
            activeTab === "trades"
              ? "text-black dark:text-white"
              : "text-neutral-500 dark:text-neutral-400 "
          )}
        >
          Recent Trades
        </button>
      </div>

      {activeTab === "orderbook" ? (
        <div className="flex flex-col h-full">
          {/* --- OB CONTROLS --- */}
          <div className="flex items-center justify-between px-3 py-2 ">
            <div className="flex gap-1 text-black dark:text-white">
              <ViewOptionBtn
                active={viewMode === "all"}
                onClick={() => setViewMode("all")}
                icon={<IconAll />}
              />
              <ViewOptionBtn
                active={viewMode === "bids"}
                onClick={() => setViewMode("bids")}
                icon={<IconBids />}
              />
              <ViewOptionBtn
                active={viewMode === "asks"}
                onClick={() => setViewMode("asks")}
                icon={<IconAsks />}
              />
            </div>

            {/* Grouping Dropdown */}
            <div className="relative inline-block text-left">
              <Menu as="div" className="relative">
                <MenuButton className="flex items-center text-black dark:text-white gap-2 text-[11px] bg-black/5 dark:bg-white/5  px-2 py-2 rounded transition-colors outline-none">
                  {grouping}
                  <ChevronDownIcon
                    className="h-3 w-3 opacity-60"
                    aria-hidden="true"
                  />
                </MenuButton>
                <Transition
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <MenuItems className="absolute right-0 z-50 mt-1 w-20 origin-top-right rounded bg-black/10 dark:bg-white/10 backdrop-blur-lg shadow-lg focus:outline-none py-1">
                    {groups.map((val: number) => (
                      <MenuItem key={val}>
                        {({ active }) => (
                          <button
                            onClick={() => setGrouping(val)}
                            className={clsx(
                              "block w-full px-3 py-1.5 text-right text-[11px] transition-colors",
                              active
                                ? " bg-black/5 text-black dark:bg-white/5 dark:text-white"
                                : "text-neutral-600 dark:text-neutral-400",
                              grouping === val && "text-[#FCD535]"
                            )}
                          >
                            {val}
                          </button>
                        )}
                      </MenuItem>
                    ))}
                  </MenuItems>
                </Transition>
              </Menu>
            </div>
          </div>

          {/* --- COLUMN HEADERS --- */}
          <div className="grid grid-cols-3 px-4 py-1 mb-1 text-neutral-700 dark:text-neutral-400 text-[10px] font-medium tracking-wide">
            <div className="text-left">Price({symbol?.quote || '--'})</div>
            <div className="text-right">Amount({symbol?.base || '--'})</div>
            <div className="text-right">Total</div>
          </div>

          {/* --- ORDER LIST --- */}
          <div className="flex-1 overflow-hidden relative">
            {/* ASKS (Red) */}
            {viewMode !== "bids" && (
              <div
                className={clsx(
                  "flex flex-col justify-end overflow-hidden",
                  viewMode === "all" ? "h-[240px]" : "h-[480px]" // Fixed heights
                )}
              >
                {visibleAsks.map((row: any) => (
                  <OrderRow
                    key={row.price}
                    row={row}
                    type="ask"
                    decimals={decimals}
                  />
                ))}
              </div>
            )}

            {/* MID PRICE TICKER */}
            <MidPriceTicker lastPrice={lastPrice} decimals={decimals} />

            {/* BIDS (Green) */}
            {viewMode !== "asks" && (
              <div
                className={clsx(
                  "overflow-hidden",
                  viewMode === "all" ? "h-[240px]" : "h-[480px]" // Fixed heights
                )}
              >
                {visibleBids.map((row: any) => (
                  <OrderRow
                    key={row.price}
                    row={row}
                    type="bid"
                    decimals={decimals}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* --- TRADES TAB --- */
        <TradesList trades={trades} />
      )}
    </div>
  );
}

function OrderRow({
  row,
  type,
  decimals,
}: {
  row: ProcessedRow;
  type: "bid" | "ask";
  decimals: number;
}) {
  const colorClass = type === "ask" ? "text-rose-400" : "text-emerald-400";
  const bgClass = type === "ask" ? "bg-rose-400" : "bg-emerald-400";
  const price = Number(row.price);
  return (
    <div className="grid grid-cols-3 px-4 py-[2px] relative hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer">
      {/* Depth Visual Bar */}
      <div
        className={clsx(
          "absolute top-0 right-0 h-full opacity-[0.12] transition-all duration-300",
          bgClass
        )}
        style={{ width: `${row.depthPercent}%` }}
      />

      <div className={clsx("text-left z-10 text-[11px]", colorClass)}>
        {price > 999
          ? price?.toLocaleString(undefined, {
              maximumFractionDigits: decimals,
            })
          : price}
      </div>
      <div className="text-right text-black dark:text-white z-10  text-[11px]">
        {row.size.toLocaleString(undefined, { minimumFractionDigits: 3 })}
      </div>
      <div className="text-right text-black dark:text-white  z-10  text-[11px]">
        {row.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </div>
    </div>
  );
}

function TradesList({ trades }: { trades: Trade[] }) {
  const { symbol } = useTradeStore();

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="grid grid-cols-3 px-4 py-2 text-neutral-700 dark:text-neutral-400 text-[10px] font-medium ">
        <div className="text-left">Price({symbol?.quote})</div>
        <div className="text-right">Amount({symbol?.base})</div>
        <div className="text-right">Time</div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[#2b3139]">
        {trades.map((t) => (
          <div
            key={t.id}
            className="grid grid-cols-3 px-4 py-[3px] hover:bg-black/5 dark:hover:bg-white/5 text-[11px] "
          >
            {/* isBuyerMaker = true means Sell (Red), false means Buy (Green) in standard crypto streams */}
            <div
              className={t.isBuyerMaker ? "text-rose-400" : "text-emerald-400"}
            >
              {t.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-right text-black dark:text-white">
              {t.qty.toFixed(5)}
            </div>
            <div className="text-right text-black dark:text-white">
              {new Date(t.time).toLocaleTimeString([], {
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ViewOptionBtn({
  active,
  icon,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "p-1.5 rounded hover:bg-black/5 dark:bg-white/5 transition-colors",
        active ? "bg-black/5 dark:bg-white/5" : "opacity-40 hover:opacity-100"
      )}
    >
      {icon}
    </button>
  );
}

type ProcessedRow = {
  price: string;
  size: number;
  total: number;
  depthPercent: number;
};

// --- Icons ---

const IconAll = () => (
  <svg fill="none" viewBox="0 0 24 24" className="w-5 h-5 ">
    <rect
      x="3.5"
      y="3.5"
      width="7"
      height="7"
      className="stroke-green-500"
    ></rect>
    <rect
      x="3.5"
      y="13.5"
      width="7"
      height="7"
      className="stroke-red-500"
    ></rect>
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M21 3H13V6H21V3ZM21 8H13V11H21V8ZM13 13H21V16H13V13ZM21 18H13V21H21V18Z"
      fill="currentColor"
    ></path>
  </svg>
);

const IconBids = () => (
  <svg fill="none" viewBox="0 0 24 24" className="w-5 h-5">
    <rect
      x="3.5"
      y="3.5"
      width="7"
      height="17"
      className="stroke-green-500"
    ></rect>
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M13 4h7v4h-7V4zm0 6h7v4h-7v-4zm7 6h-7v4h7v-4z"
      fill="currentColor"
    ></path>
  </svg>
);

const IconAsks = () => (
  <svg fill="none" viewBox="0 0 24 24" className="w-5 h-5 ">
    <rect
      x="3.5"
      y="3.5"
      width="7"
      height="17"
      className="stroke-red-500"
    ></rect>
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M13 4h7v4h-7V4zm0 6h7v4h-7v-4zm7 6h-7v4h7v-4z"
      fill="currentColor"
    ></path>
  </svg>
);

export function MidPriceTicker({
  lastPrice,
  decimals,
}: {
  lastPrice: number;
  decimals: number;
}) {
  const prevPriceRef = useRef<number>(lastPrice);
  const [direction, setDirection] = useState<"up" | "down" | "neutral">(
    "neutral"
  );
  const [pulseTrigger, setPulseTrigger] = useState(0);

  useEffect(() => {
    if (!lastPrice || lastPrice === prevPriceRef.current) return;

    setDirection(lastPrice > prevPriceRef.current ? "up" : "down");
    setPulseTrigger((p) => p + 1);
    prevPriceRef.current = lastPrice;
  }, [lastPrice]);

  return (
    <div className="sticky py-1.5 px-4 flex items-center justify-between  z-10">
      <div className="flex items-center gap-2">
        {/* ROTATING ICON */}
        <div
          className={clsx(
            "transition-all duration-500 ease-in-out transform",
            direction === "up" ? "rotate-0" : "rotate-180",
            direction === "neutral" ? "opacity-0" : "opacity-100"
          )}
        >
          <ArrowUpIcon
            strokeWidth={1}
            className={clsx(
              "h-5",
              direction === "up" ? "text-emerald-400" : "text-rose-400"
            )}
          />
        </div>

        {/* TEXT COLOR ANIMATION */}
        <span
          key={pulseTrigger} // Re-triggers the @keyframes animation on every price change
          className={clsx(
            "text-xl tracking-tighter transition-colors duration-300",
            direction === "up" && "animate-text-pulse-green text-emerald-400",
            direction === "down" && "animate-text-pulse-red text-rose-400",
            direction === "neutral" && "text-black dark:text-white"
          )}
        >
          {lastPrice
            ? lastPrice?.toLocaleString(undefined, {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
              })
            : null}
        </span>
      </div>
    </div>
  );
}
