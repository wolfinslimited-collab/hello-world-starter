import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  createChart,
  ColorType,
  CandlestickSeries,
  HistogramSeries,
  IChartApi,
  ISeriesApi,
  UTCTimestamp,
} from "lightweight-charts";
import { ChevronDown } from "lucide-react";
import { Menu, Transition } from "@headlessui/react";
import { useTradeStore } from "./component/store";
import clsx from "clsx";
// Note: Using native fetch for external AsterDEX APIs (not get utility which routes through edge function)

const TIMEFRAMES = [
  { label: "1m", value: "1m", seconds: 60 },
  { label: "5m", value: "5m", seconds: 300 },
  { label: "15m", value: "15m", seconds: 900 },
  { label: "1H", value: "1h", seconds: 3600 },
  { label: "4H", value: "4h", seconds: 14400 },
  { label: "1D", value: "1d", seconds: 86400 },
  { label: "1W", value: "1w", seconds: 86400 },
  { label: "1M", value: "1m", seconds: 86400 },
];

type ChartView = "original" | "depth";

const Chart = () => {
  const { symbol, lastPrice } = useTradeStore();
  const [interval, setInterval] = useState(TIMEFRAMES[4]);
  const [view, setView] = useState<ChartView>("original");

  // --- 1. Calculate Precision based on Symbol ---
  const pricePrecision = symbol?.pricePrecision ?? 2;
  const minMove = Math.pow(10, -pricePrecision);

  const BASE_API =
    symbol?.type === "SPOT"
      ? `https://sapi.asterdex.com/api/v1`
      : `https://www.asterdex.com/fapi/v1`;

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<IChartApi | null>(null);
  const candleSeries = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeries = useRef<ISeriesApi<"Histogram"> | null>(null);
  // Keep track of resize observer to disconnect it properly
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Data State
  const [candleData, setCandleData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // --- Helpers ---
  const formatKlines = (data: any[]) => {
    return data.map((d: any) => ({
      time: (d[0] / 1000) as UTCTimestamp,
      open: parseFloat(d[1]),
      high: parseFloat(d[2]),
      low: parseFloat(d[3]),
      close: parseFloat(d[4]),
      volume: parseFloat(d[5]),
    }));
  };

  // --- API Calls ---
  const fetchKlines = useCallback(
    async (endTime?: number) => {
      if (!symbol?.externalSymbol || loading) return;
      setLoading(true);
      try {
        let url = `${BASE_API}/klines?symbol=${symbol.externalSymbol}&interval=${interval.value}&limit=500`;
        if (endTime) url += `&endTime=${endTime}`;

        // Use native fetch for external AsterDEX API
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Klines fetch failed: ${response.status}`);
        const json: any = await response.json();
        
        if (!Array.isArray(json) || json.length === 0) {
          setHasMore(false);
          return;
        }

        const formatted = formatKlines(json);
        const sorted = formatted.sort(
          (a, b) => (a.time as number) - (b.time as number)
        );

        if (endTime) {
          setCandleData((prev) => {
            const newPoints = sorted.filter(
              (n) => !prev.find((p) => p.time === n.time)
            );
            return [...newPoints, ...prev];
          });
        } else {
          setCandleData(sorted);
        }
      } catch (e) {
        console.error("Fetch error", e);
      } finally {
        setLoading(false);
      }
    },
    [symbol?.externalSymbol, interval, BASE_API, loading]
  );

  // --- Effects ---

  // 1. Initial Load / Interval Change
  useEffect(() => {
    setCandleData([]);
    setHasMore(true);
    fetchKlines();
  }, [symbol?.externalSymbol, interval.value]); // Only refetch if symbol or interval changes

  // 2. Chart Initialization (Mount & Cleanup)
  useEffect(() => {
    if (!containerRef.current) return;

    // Create Chart
    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#9ca3af",
      },
      grid: {
        vertLines: { color: "transparent" },
        horzLines: { color: "transparent" },
      },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      timeScale: {
        borderColor: "rgba(100, 100, 100, 0.1)",
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: "rgba(100, 100, 100, 0.1)",
      },
    });

    chartInstance.current = chart;

    // -- Create Series --
    if (view === "original") {
      // CANDLES
      candleSeries.current = chart.addSeries(CandlestickSeries, {
        upColor: "#2ebd85",
        downColor: "#f6465d",
        borderVisible: false,
        wickUpColor: "#2ebd85",
        wickDownColor: "#f6465d",
        // --- FIX: Apply Price Precision from Symbol ---
        priceFormat: {
          type: "price",
          precision: pricePrecision,
          minMove: minMove,
        },
      });

      // VOLUME
      volumeSeries.current = chart.addSeries(HistogramSeries, {
        priceFormat: { type: "volume" },
        priceScaleId: "",
      });

      volumeSeries.current.priceScale().applyOptions({
        scaleMargins: {
          top: 0.85,
          bottom: 0,
        },
      });
    }

    // -- Resize Observer --
    resizeObserverRef.current = new ResizeObserver((entries) => {
      if (entries.length === 0 || !entries[0].target) return;
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height });
    });
    resizeObserverRef.current.observe(containerRef.current);

    // -- Infinite Scroll Handler --
    chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (
        range &&
        range.from < 5 &&
        !loading &&
        hasMore &&
        view === "original"
      ) {
        // Logic to fetch more data...
        // Note: You need to be careful calling fetchKlines here to avoid closure staleness
        // Ideally, trigger an action or use a ref for current data state
        const currentData = candleSeries.current?.data();
        if (currentData && currentData.length > 0) {
          const oldestTime = currentData[0]?.time;
          if (oldestTime) {
            fetchKlines((oldestTime as number) * 1000);
          }
        }
      }
    });

    // --- CLEANUP (Unmount) ---
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      chart.remove();

      // Nullify all refs to ensure no memory leaks ("remove every this")
      chartInstance.current = null;
      candleSeries.current = null;
      volumeSeries.current = null;
      resizeObserverRef.current = null;
    };
  }, [view, pricePrecision]); // Crucial: Re-run only if View or Precision changes. NOT when data changes.

  // 3. Data Injection (Updates existing chart)
  useEffect(() => {
    if (!chartInstance.current || view !== "original") return;

    if (candleSeries.current && candleData.length > 0) {
      candleSeries.current.setData(candleData);
    }

    if (volumeSeries.current && candleData.length > 0) {
      const volumeData = candleData.map((d) => ({
        time: d.time,
        value: d.volume,
        color:
          d.close >= d.open
            ? "rgba(46, 189, 133, 0.3)"
            : "rgba(246, 70, 93, 0.3)",
      }));
      volumeSeries.current.setData(volumeData);
    }
  }, [candleData, view]);

  // 4. Real-time Updates (Last Price)
  useEffect(() => {
    if (!candleSeries.current || candleData.length === 0 || view !== "original")
      return;

    const lastCandle = candleData[candleData.length - 1];
    if (!lastCandle || !lastPrice) return;

    const updatedCandle = {
      ...lastCandle,
      close: lastPrice,
      high: Math.max(lastCandle.high, lastPrice),
      low: Math.min(lastCandle.low, lastPrice),
    };

    candleSeries.current.update(updatedCandle);
  }, [lastPrice, view, candleData]); // Note: depending on candleData here is slightly heavy but necessary for `lastCandle` logic

  return (
    <div className="flex flex-col h-full w-full bg-black/3 dark:bg-white/7 rounded-md overflow-hidden ">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-black/3 dark:border-white/3 text-[12px]">
        {/* Left: View & Timeframes */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3 text-black/40 dark:text-white/40 font-medium">
            {TIMEFRAMES.slice(0, 4).map((tf) => (
              <button
                key={tf.value}
                onClick={() => setInterval(tf)}
                className={clsx(
                  "hover:text-black dark:hover:text-white transition-colors",
                  interval.value === tf.value &&
                    "text-black dark:text-white border-b-2 border-black dark:border-white"
                )}
              >
                {tf.label}
              </button>
            ))}
          </div>
          <div className="relative z-20">
            <Menu as="div">
              <Menu.Button className="flex items-center gap-1 text-black dark:text-white hover:opacity-70">
                {interval.label} <ChevronDown size={12} />
              </Menu.Button>
              <Transition
                enter="transition duration-100 ease-out"
                enterFrom="transform scale-95 opacity-0"
                enterTo="transform scale-100 opacity-100"
                leave="transition duration-75 ease-out"
                leaveFrom="transform scale-100 opacity-100"
                leaveTo="transform scale-95 opacity-0"
              >
                <Menu.Items className="absolute top-full left-0 mt-2 w-24 bg-white dark:bg-[#1e1e1e] border border-black/10 dark:border-white/10 rounded shadow-lg flex flex-col p-1">
                  {TIMEFRAMES.map((tf) => (
                    <Menu.Item key={tf.value}>
                      {({ active }) => (
                        <button
                          onClick={() => setInterval(tf)}
                          className={clsx(
                            "text-left px-2 py-1.5 rounded text-[11px]",
                            active
                              ? "bg-black/5 dark:bg-white/10 text-black dark:text-white"
                              : "text-black/60 dark:text-white/60",
                            interval.value === tf.value && "text-blue-500"
                          )}
                        >
                          {tf.label}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>

        {/* Right: Settings */}
        <div className="flex bg-black/5 dark:bg-white/5 rounded p-0.5">
          <button
            onClick={() => setView("original")}
            className={clsx(
              "px-3 py-1 rounded transition-colors",
              view === "original"
                ? "bg-white dark:bg-white/10 text-black dark:text-white shadow-sm"
                : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
            )}
          >
            Original
          </button>
          <button
            onClick={() => setView("depth")}
            className={clsx(
              "px-3 py-1 rounded transition-colors",
              view === "depth"
                ? "bg-white dark:bg-white/10 text-black dark:text-white shadow-sm"
                : "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
            )}
          >
            Depth
          </button>
        </div>
      </div>

      {/* Chart Container */}
      <div ref={containerRef} className="flex-1 w-full relative"></div>
    </div>
  );
};

export default Chart;
