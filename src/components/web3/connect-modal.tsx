import { useEffect, useState } from "react";
import { useWallet as useSolWallet } from "@solana/wallet-adapter-react";
import { useConnect } from "wagmi";
import { ChevronLeft, Wallet, ChevronRight, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- ICONS CONFIG ---
const Icons = {
  ETH: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  BNB: "https://cryptologos.cc/logos/bnb-bnb-logo.png",
  SOL: "https://cryptologos.cc/logos/solana-sol-logo.png",
  ARB: "https://cryptologos.cc/logos/arbitrum-arb-logo.png",
};

type ViewState = "NETWORKS" | "SOL_WALLETS" | "EVM_WALLETS";
type ChainType = "eth" | "bsc" | "solana" | "arbitrum";

interface UnifiedConnectModalProps {
  onClose?: () => void;
  chain?: ChainType;
}

const ConnectModal = ({ onClose, chain }: UnifiedConnectModalProps) => {
  const { connectors, connect } = useConnect();

  // SOL Adapter
  const { wallets: solWallets, select: selectSol } = useSolWallet();

  // --- Initialize state ---
  const [view, setView] = useState<ViewState>(() => {
    if (chain === "solana") return "SOL_WALLETS";
    if (chain === "eth" || chain === "bsc" || chain === "arbitrum") return "EVM_WALLETS";
    return "NETWORKS";
  });

  useEffect(() => {
    if (chain) handleNetworkSelect(chain);
  }, [chain]);

  const handleNetworkSelect = (chain: ChainType) => {
    if (chain === "eth" || chain === "bsc" || chain === "arbitrum") setView("EVM_WALLETS");
    else if (chain === "solana") setView("SOL_WALLETS");
  };

  const handleWalletSelect = (wallet: any, type: "SOL" | "EVM") => {
    if (type === "SOL") selectSol(wallet.adapter.name);
    else if (type === "EVM") connect({ connector: wallet });
    onClose?.();
  };

  const handleBack = () => setView("NETWORKS");

  // Smoother Animation variants
  const slideVariants = {
    enter: { x: 20, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -20, opacity: 0 },
  };

  return (
    // Added text-gray-900 for light mode base color
    <div className="w-full flex flex-col h-full max-h-[600px] text-gray-900 dark:text-white">
      {/* HEADER */}
      <div className="flex items-center gap-3 px-1 pb-4 border-b border-gray-200 dark:border-white/10 mb-2">
        {view !== "NETWORKS" ? (
          <button
            onClick={handleBack}
            className="p-1.5 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ChevronLeft className="size-8" />
          </button>
        ) : (
          <div className="p-1.5 -ml-2">
            <Layers className="size-7 text-neutral-600 dark:text-neutral-400" />
          </div>
        )}
        <div className="flex flex-col">
          <h2 className="text-lg font-bold leading-tight tracking-tight text-gray-900 dark:text-white">
            {view === "NETWORKS" ? "Select Network" : "Connect Wallet"}
          </h2>
          <span className="text-xs text-gray-500 dark:text-neutral-500 font-medium">
            {view === "NETWORKS"
              ? "Choose a chain to continue"
              : "Select a provider to connect"}
          </span>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-hidden relative mt-2">
        <AnimatePresence mode="wait" initial={false}>
          {/* 1. NETWORKS LIST */}
          {view === "NETWORKS" && (
            <motion.div
              key="networks"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex flex-col gap-2"
            >
              <NetworkRow
                name="Ethereum"
                description="EVM Compatible"
                icon={Icons.ETH}
                onClick={() => handleNetworkSelect("eth")}
              />
              <NetworkRow
                name="BNB Chain"
                description="Binance Smart Chain"
                icon={Icons.BNB}
                onClick={() => handleNetworkSelect("bsc")}
              />
              <NetworkRow
                name="Arbitrum"
                description="Ethereum L2"
                icon={Icons.ARB}
                onClick={() => handleNetworkSelect("arbitrum")}
              />
              <NetworkRow
                name="Solana"
                description="High speed L1"
                icon={Icons.SOL}
                onClick={() => handleNetworkSelect("solana")}
              />
            </motion.div>
          )}

          {/* 2. EVM WALLETS */}
          {view === "EVM_WALLETS" && (
            <motion.div
              key="evm-wallets"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="flex flex-col gap-2 pr-1 h-full overflow-y-auto custom-scrollbar"
            >
              {connectors.length === 0 && <NoWalletsMessage chain="EVM" />}
              {connectors.map((connector) => (
                <WalletRow
                  key={connector.uid}
                  name={connector.name}
                  icon={connector.icon || Icons.ETH}
                  onClick={() => handleWalletSelect(connector, "EVM")}
                />
              ))}
            </motion.div>
          )}

          {/* 3. SOLANA WALLETS */}
          {view === "SOL_WALLETS" && (
            <motion.div
              key="sol-wallets"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="flex flex-col gap-2 pr-1 h-full overflow-y-auto custom-scrollbar"
            >
              {solWallets.length === 0 && <NoWalletsMessage chain="Solana" />}
              {solWallets.map((w) => (
                <WalletRow
                  key={w.adapter.name}
                  name={w.adapter.name}
                  icon={w.adapter.icon}
                  onClick={() => handleWalletSelect(w, "SOL")}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- SUB COMPONENTS ---

const NetworkRow = ({
  name,
  description,
  icon,
  onClick,
}: {
  name: string;
  description?: string;
  icon: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    // Added bg-white/border-gray-200 for light mode
    className="group flex items-center justify-between w-full p-3 rounded-xl 
      bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300
      dark:bg-neutral-800/20 dark:border-white/5 dark:hover:bg-neutral-800/60 dark:hover:border-white/10 
      transition-all duration-200 active:scale-[0.99] shadow-sm dark:shadow-none"
  >
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="absolute inset-0 bg-blue-500/10 dark:bg-white/10 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <img
          src={icon}
          alt={name}
          className="relative w-10 h-10 object-cover"
        />
      </div>
      <div className="flex flex-col items-start">
        <span className="font-semibold text-gray-900 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-white transition-colors">
          {name}
        </span>
        {description && (
          <span className="text-xs text-gray-500 dark:text-neutral-500 group-hover:text-gray-600 dark:group-hover:text-neutral-400">
            {description}
          </span>
        )}
      </div>
    </div>
    <ChevronRight className="size-5 text-gray-400 dark:text-neutral-600 group-hover:text-gray-600 dark:group-hover:text-neutral-400 transition-colors" />
  </button>
);

const WalletRow = ({
  name,
  icon,
  onClick,
}: {
  name: string;
  icon: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    // Transparent bg default, hover gray-50 in light mode
    className="group flex items-center justify-between w-full p-3 rounded-xl 
      border border-transparent hover:bg-gray-50 hover:border-gray-200
      dark:hover:bg-neutral-800 dark:hover:border-white/5 
      transition-all duration-200 active:scale-[0.99]"
  >
    <div className="flex items-center gap-3">
      <img
        src={icon}
        alt={name}
        className="w-8 h-8 object-contain rounded-lg bg-white shadow-sm border border-gray-100 dark:bg-neutral-900 dark:border-transparent dark:shadow-none"
      />
      <span className="font-medium text-gray-700 dark:text-neutral-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
        {name}
      </span>
    </div>
    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
      <div className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-700 dark:bg-white/10 dark:text-white font-medium">
        Connect
      </div>
    </div>
  </button>
);

const NoWalletsMessage = ({ chain }: { chain: string }) => (
  <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-neutral-500 border border-dashed border-gray-200 dark:border-white/10 rounded-xl bg-gray-50/50 dark:bg-white/5">
    <div className="p-3 bg-white border border-gray-100 dark:bg-neutral-800/50 dark:border-transparent rounded-full mb-3 shadow-sm dark:shadow-none">
      <Wallet className="size-6 opacity-50 text-gray-400 dark:text-white" />
    </div>
    <p className="text-sm font-medium text-gray-600 dark:text-neutral-400">
      No {chain} wallets detected
    </p>
    <p className="text-xs text-gray-400 dark:text-neutral-600 mt-1">
      Install a wallet to continue
    </p>
  </div>
);

export default ConnectModal;
