import { useSyncExternalStore } from "react";

/* ---------------- Types (KEPT EXACTLY AS YOURS) ---------------- */

export type TradeSymbol = {
  id: number;
  symbol: string;
  externalSymbol: string;
  provider: string;
  type: "SPOT" | "PERPETUAL";
  base: string;
  quote: string;
  baseAsset: any;
  quoteAsset: any;
  pricePrecision: number;
};

type TradeState = {
  symbol: TradeSymbol | null;
  lastPrice: number;
  ticker: any;
};

type Listener = () => void;
type EventCallback = (data: any) => void;

/* ---------------- Store Implementation ---------------- */

const initialState: TradeState = {
  symbol: null,
  lastPrice: 0,
  ticker: null,
};

let state: TradeState = { ...initialState }; // Use object spread to create unique reference

const listeners = new Set<Listener>();
const eventListeners = new Map<string, Set<EventCallback>>();

const emit = () => listeners.forEach((l) => l());

export const tradeStore = {
  getState: () => state,

  /* --- Actions (YOUR ORIGINAL NAMES) --- */

  setSymbol(symbol: TradeSymbol) {
    if (state.symbol?.symbol === symbol.symbol) return; // Prevent loop
    state = { ...state, symbol };
    emit();
  },

  setLastPrice(price: number) {
    state = { ...state, lastPrice: price };
    emit();
  },

  setTicker(ticker: any) {
    state = { ...state, ticker };
    emit();
  },

  reset() {
    state = { ...initialState };
    emit();
  },

  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  on(event: string, callback: EventCallback) {
    if (!eventListeners.has(event)) {
      eventListeners.set(event, new Set());
    }
    eventListeners.get(event)!.add(callback);
    return () => {
      const set = eventListeners.get(event);
      if (set) {
        set.delete(callback);
        if (set.size === 0) eventListeners.delete(event);
      }
    };
  },

  emitEvent(event: string, data: any) {
    const set = eventListeners.get(event);
    if (set) {
      set.forEach((cb) => cb(data));
    }
  },
};

/* ---------------- Hook ---------------- */

export function useTradeStore() {
  const snapshot = useSyncExternalStore(
    tradeStore.subscribe,
    tradeStore.getState
  );

  return {
    ...snapshot,
    setSymbol: tradeStore.setSymbol,
    setLastPrice: tradeStore.setLastPrice,
    setTicker: tradeStore.setTicker,
    resetTrade: tradeStore.reset, // Kept your name
    emitEvent: tradeStore.emitEvent,
    onEvent: tradeStore.on,
  };
}
