import { useEffect, useState } from "react";
import { Briefcase, List, History, RefreshCcw } from "lucide-react";
import { useGetData } from "hooks/use-query";
import HistoryList from "./component/trade-history";
import OrdersList from "./component/order-history";
import { useTradeStore } from "./component/store";
import PositionsList from "./component/position-list";

export default function TradingDashboard() {
  const { symbol } = useTradeStore();

  const { onEvent } = useTradeStore();
  const [activeTab, setActiveTab] = useState<
    "positions" | "orders" | "history"
  >("positions");

  const scroll = () => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  };

  const {
    data: positions,
    loading: posLoading,
    refetch: refetchPos,
  } = useGetData({ path: `trade/positions?pairId=${symbol?.id}`, auth: true });

  const {
    data: orders,
    loading: orderLoading,
    refetch: refetchOrders,
  } = useGetData({ path: `trade/orders?pairId=${symbol?.id}`, auth: true });

  // 2. Destructure refetch for history
  const {
    data: history,
    loading: histLoading,
    refetch: refetchHistory,
  } = useGetData({
    auth: true,
    path: `trade/history?pairId=${symbol?.id}`,
  });

  // Mutation Hooks
  const { fetchData: closePosition, loading: closingId } = useGetData({
    auth: true,
  });

  const { fetchData: cancelOrder, loading: cancelingId } = useGetData({
    auth: true,
  });

  useEffect(() => {
    onEvent("order", () => {
      setActiveTab("orders");
      scroll();
      refetchOrders();
    });
    onEvent("position", () => {
      setActiveTab("positions");
      scroll();
      refetchPos();
    });
  }, []);

  const handleClose = async (id: number) => {
    await closePosition(`trade/close/${id}`);
    refetchPos();
  };

  const handleCancel = async (id: number) => {
    await cancelOrder(`trade/cancel/${id}`);
    refetchOrders();
  };

  // 3. Helper to refresh current tab
  const handleRefresh = () => {
    if (activeTab === "history") refetchHistory();
    if (activeTab === "positions") refetchPos();
    if (activeTab === "orders") refetchOrders();
  };

  return (
    <div className="w-full flex flex-col overflow-hidden bg-black/3 dark:bg-white/7 rounded-md text-black dark:text-white">
      {/* NAVIGATION */}
      <nav className="flex items-center">
        <TabButton
          active={activeTab === "positions"}
          onClick={() => setActiveTab("positions")}
          icon={<Briefcase size={16} />}
          label="Positions"
        />
        <TabButton
          active={activeTab === "orders"}
          onClick={() => setActiveTab("orders")}
          icon={<List size={16} />}
          label="Open Orders"
        />
        <TabButton
          active={activeTab === "history"}
          onClick={() => setActiveTab("history")}
          icon={<History size={16} />}
          label="History"
        />

        {/* 4. Refresh Button aligned to the right */}
        <button
          onClick={handleRefresh}
          title="Refresh Data"
          className="ml-auto mr-4 p-2 opacity-50 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-all"
        >
          <RefreshCcw size={16} />
        </button>
      </nav>

      {/* CONTENT AREA */}
      <main className="min-h-[300px] relative">
        {activeTab === "positions" && (
          <PositionsList
            data={positions}
            loading={posLoading}
            onAction={handleClose}
            actionLoading={closingId}
          />
        )}
        {activeTab === "orders" && (
          <OrdersList
            data={orders}
            loading={orderLoading}
            onAction={handleCancel}
            actionLoading={cancelingId}
          />
        )}
        {activeTab === "history" && (
          <HistoryList data={history} loading={histLoading} />
        )}
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-8 py-4 text-xs font-black uppercase tracking-tighter transition-all
        ${active ? "" : "opacity-40 hover:opacity-100"}
      `}
    >
      {icon} {label}
    </button>
  );
}
