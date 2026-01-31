import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import HeaderInfo from "./info";
import Chart from "./chart";
import OrderBook from "./orderbook";
import OrderEntry from "./orderentry";
import UserHistory from "./history";

import useStorage from "context";
import { get } from "utils/request";
import { useTradeStore, TradeSymbol } from "./component/store";

type TradeParams = {
  type?: "spot" | "perpetual";
  pair?: string;
};

export default function Trade() {
  const { symbol, resetTrade, setSymbol } = useTradeStore();

  const navigate = useNavigate();
  const { type, pair } = useParams<TradeParams>();

  const {
    app: { pairs = [] },
    setApp,
  } = useStorage();

  const [loading, setLoading] = useState(false);

  /* ---------- Fetch pairs ---------- */
  useEffect(() => {
    if (pairs.length) return;

    const fetchPairs = async () => {
      setLoading(true);
      try {
        const res: any = await get("trade/pairs");
        if (res?.success) {
          // Transform object with numeric keys to array
          let pairsArray: any[] = [];
          const pairsData = res?.data || res;
          
          if (Array.isArray(pairsData)) {
            pairsArray = pairsData;
          } else if (pairsData && typeof pairsData === 'object') {
            // API returns { "0": {...}, "1": {...}, success: true }
            pairsArray = Object.entries(pairsData)
              .filter(([key]) => !isNaN(Number(key)))
              .map(([, value]) => value);
          }
          
          // Transform snake_case API fields to camelCase for store compatibility
          const transformedPairs = pairsArray.map((p: any) => ({
            ...p,
            externalSymbol: p.external_symbol || p.externalSymbol,
            pricePrecision: p.price_precision ?? p.pricePrecision ?? 2,
            quantityPrecision: p.quantity_precision ?? p.quantityPrecision ?? 3,
            tickSize: p.tick_size ?? p.tickSize ?? 0.01,
            stepSize: p.step_size ?? p.stepSize ?? 0.001,
            minQty: p.min_qty ?? p.minQty ?? 0.001,
            maxQty: p.max_qty ?? p.maxQty ?? 1000000,
            minPrice: p.min_price ?? p.minPrice ?? 0,
            baseAssetId: p.base_asset_id ?? p.baseAssetId,
            quoteAssetId: p.quote_asset_id ?? p.quoteAssetId,
          }));
          
          setApp({ pairs: transformedPairs });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPairs();
  }, [pairs.length, setApp]);

  /* ---------- Validate route ---------- */
  useEffect(() => {
    if (!type || !pair) navigate("/");
    if (type && !["spot", "perpetual"].includes(type)) navigate("/");
  }, [type, pair, navigate]);

  /* ---------- Resolve symbol ---------- */
  const _symbol = useMemo<TradeSymbol | null>(() => {
    if (!pairs.length || !type || !pair) return null;
    return (
      pairs.find(
        (p: TradeSymbol) =>
          p.symbol === pair.toUpperCase() && p.type === type.toUpperCase()
      ) ?? null
    );
  }, [pairs, type, pair]);

  /* ---------- Init store ---------- */
  useEffect(() => {
    if (_symbol) {
      setSymbol(_symbol);
    }
    // Only reset on unmount, not on every pair change
    return () => {
      // Optional: You can remove resetTrade() here if you want to keep data
      // while switching. If you keep it, the "Loading" check below catches it.
      resetTrade();
    };
  }, [_symbol, setSymbol, resetTrade]);

  /* ---------- Loading State UI ---------- */
  if (loading) {
    return (
      <div className="h-[60vh] w-full flex flex-col items-center justify-center gap-4 text-neutral-400">
        Loading...
      </div>
    );
  }

  /* ---------- Not Found UI ---------- */
  if (!_symbol && pairs.length > 0) {
    return (
      <div className="h-[60vh] w-full flex flex-col items-center justify-center gap-4">
        Market Not Found
      </div>
    );
  }

  /* ---------- CRITICAL FIX ---------- */
  // If the store symbol doesn't match the URL symbol yet,
  // do not render the children (Chart/OrderBook).
  // This waits for the useEffect above to fire setSymbol().
  if (symbol?.symbol !== _symbol?.symbol) {
    return <div className="h-[60vh] w-full" />; // Or a spinner
  }

  return (
    // Removed key={viewKey} to prevent full remount
    <div className="flex flex-col gap-3 w-full px-3 pb-10 text-neutral-200">
      <div className="flex flex-col md:flex-row gap-3">
        {/* Chart Area */}
        <div className="flex flex-col gap-3 min-w-0 w-full md:flex-1">
          <HeaderInfo />
          <div className="h-[400px] md:flex-1 md:min-h-[400px]">
            <Chart />
          </div>
        </div>

        {/* Order Book */}
        <div className="w-full md:w-[280px] md:min-w-[280px]">
          <OrderBook />
        </div>

        {/* Order Entry */}
        <div className="w-full md:w-[280px] md:min-w-[280px]">
          <OrderEntry />
        </div>
      </div>

      <div className="flex-1 min-h-[200px]">
        <UserHistory />
      </div>
    </div>
  );
}
