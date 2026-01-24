import React, { useState, useEffect, Fragment, useMemo } from "react";
import { useWeb3 } from "./use-web3";
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react";
import { User, Wallet, LogOut, ChevronDown, Loader2 } from "lucide-react";
import Modal from "components/specific/modal";
import ConnectModal from "./connect-modal";
import { json } from "utils/request";
import useStorage from "context";
import { Link } from "react-router-dom";

// Helper component for dropdown links
const LinkItem = ({ icon: Icon, label, link }: any) => (
  <Link
    to={link}
    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
  >
    <Icon className="size-4 text-neutral-500 dark:text-neutral-400" />
    <span>{label}</span>
  </Link>
);

interface WalletButtonProps {
  /**
   * Optional: Force the button to track a specific chain.
   * If omitted, it tracks the currently active connection.
   */
  chain?: "eth" | "bsc" | "solana" | "tron";

  /**
   * Optional: Minimal mode.
   * - Shows full width button with full address.
   * - Dropdown only shows "Disconnect".
   */
  minimize?: boolean;
}

const WalletButton = ({ chain, minimize = false }: WalletButtonProps) => {
  const {
    app: { ref },
    setting: { isLoged },
    setSetting,
  } = useStorage();
  const web3 = useWeb3();

  // Local States for Auth Flow
  const [isSigning, setIsSigning] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // --- DERIVE ACTIVE WALLET ---
  const activeWallet = useMemo(() => {
    if (chain && web3.wallets[chain]) {
      return web3.wallets[chain];
    }
    // Auto-Detect Mode
    switch (web3.activeChain) {
      case "ETH":
        return web3.wallets.eth;
      case "BSC":
        return web3.wallets.bsc;
      case "SOLANA":
        return web3.wallets.solana;
      case "TRON":
        return web3.wallets.tron;
      default:
        return null;
    }
  }, [chain, web3.activeChain, web3.wallets]);

  // --- GET ALL CONNECTED WALLETS ---
  const connectedWallets = useMemo(() => {
    if (!web3?.wallets) return [];
    // Convert wallets object to array and filter by isConnected
    return Object.entries(web3.wallets)
      .filter(([_, wallet]: [string, any]) => wallet.isConnected)
      .map(([key, wallet]) => ({
        chainKey: key, // e.g., 'eth', 'bsc'
        name: key.toUpperCase(),
        address: wallet.addressShort,
        obj: wallet,
      }));
  }, [web3.wallets]);

  // --- AUTH LOGIC ---
  const handleAuth = async () => {
    if (activeWallet?.isConnected && !isAuthenticated && !isSigning) {
      setIsSigning(true);
      try {
        console.log(
          `🔐 Requesting Signature for ${chain || web3.activeChain}...`
        );
        const result = await activeWallet.signLoginMessage(
          "Welcome! Please sign this message to verify ownership."
        );

        if (result.success) {
          const res: any = await json("user/auth", {
            address: activeWallet.address,
            signature: result.signature,
            chain: chain ? chain.toUpperCase() : web3.activeChain,
            refId: ref,
          });

          if (res.success) {
            setSetting({ login: res.data });
            setIsAuthenticated(true);
          } else {
            activeWallet.disconnect();
          }
        } else {
          activeWallet.disconnect();
        }
      } catch (err) {
        console.error("Auth Failed", err);
        activeWallet.disconnect();
      } finally {
        setIsSigning(false);
      }
    }
  };

  // --- EFFECTS ---
  useEffect(() => {
    if (!isLoged && activeWallet?.isConnected) {
      handleAuth();
    }
  }, [activeWallet?.isConnected, isLoged]);

  useEffect(() => {
    const isConnected = chain ? activeWallet?.isConnected : web3.isConnected;
    if (!isConnected) {
      setIsAuthenticated(false);
      setIsSigning(false);
    }
  }, [web3.isConnected, activeWallet?.isConnected, chain]);

  const disconnect = () => {
    // 1. Iterate through all wallets and disconnect them
    if (web3.wallets) {
      Object.values(web3.wallets).forEach((wallet: any) => {
        if (
          wallet &&
          wallet.isConnected &&
          typeof wallet.disconnect === "function"
        ) {
          try {
            wallet.disconnect();
          } catch (e) {
            console.error("Error disconnecting wallet:", e);
          }
        }
      });
    }

    // 2. Clear App State
    setSetting(null);
  };
  // --- 1. LOADING STATE ---
  if (isSigning) {
    return (
      <button
        className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold text-neutral-500 bg-neutral-100 dark:bg-neutral-900 rounded-lg cursor-wait transition-all ${
          minimize ? "w-full justify-center" : ""
        }`}
      >
        <Loader2 className="size-4 animate-spin" />
        <span>Verifying...</span>
      </button>
    );
  }

  // --- 2. CONNECTED & AUTHENTICATED STATE ---
  if (activeWallet && activeWallet.isConnected) {
    return (
      <Popover className={`relative ${minimize ? "w-full" : ""}`}>
        {({ close }) => (
          <>
            <PopoverButton
              className={`outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-200 dark:focus:ring-neutral-800 rounded-lg ${
                minimize ? "w-full" : ""
              }`}
            >
              <div
                className={`flex items-center gap-2 py-1.5 px-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all shadow-sm ${
                  minimize ? "w-full justify-between" : ""
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="flex h-2 w-2 min-w-[0.5rem] rounded-full bg-green-500 ring-2 ring-green-500/20"></span>
                  <div
                    className={`text-sm font-medium text-neutral-700 dark:text-neutral-200 ${
                      minimize ? "truncate" : "hidden sm:block"
                    }`}
                  >
                    {minimize
                      ? activeWallet.address
                      : activeWallet.addressShort}
                  </div>
                </div>
                <ChevronDown
                  className="size-4 text-neutral-400 shrink-0"
                  strokeWidth={2}
                />
              </div>
            </PopoverButton>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <PopoverPanel
                anchor="bottom end"
                className={`absolute right-0 z-[200] mt-2 origin-top-right rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl focus:outline-none p-1 ${
                  minimize ? "w-md" : "w-64"
                }`}
              >
                <div className="p-2 space-y-1">
                  {!minimize && (
                    <>
                      {/* --- CONNECTED WALLETS LIST --- */}
                      <div className="mb-2 overflow-hidden rounded-lg border border-neutral-100 dark:border-neutral-800">
                        <div className="bg-neutral-50 px-3 py-2 dark:bg-neutral-800/50">
                          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                            Connected Networks
                          </span>
                        </div>
                        <div className="divide-y divide-neutral-100 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
                          {connectedWallets.length > 0 ? (
                            connectedWallets.map((wallet) => {
                              // Check if this wallet is the 'current' active one for this button context
                              const isActiveContext =
                                wallet.chainKey ===
                                (chain || web3.activeChain)?.toLowerCase();

                              return (
                                <div
                                  key={wallet.chainKey}
                                  className="flex items-center justify-between px-3 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group"
                                >
                                  <div className="flex items-center gap-2.5">
                                    {/* Status Dot */}
                                    <div
                                      className={`size-1.5 rounded-full ${
                                        isActiveContext
                                          ? "bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.5)]"
                                          : "bg-neutral-300 dark:bg-neutral-600"
                                      }`}
                                    />
                                    <span
                                      className={`text-xs font-bold uppercase ${
                                        isActiveContext
                                          ? "text-neutral-900 dark:text-white"
                                          : "text-neutral-600 dark:text-neutral-400"
                                      }`}
                                    >
                                      {wallet.name}
                                    </span>
                                  </div>
                                  <span className="text-xs  text-neutral-500 dark:text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors">
                                    {wallet.address}
                                  </span>
                                </div>
                              );
                            })
                          ) : (
                            <div className="px-3 py-2 text-xs text-neutral-400 italic">
                              No active connections
                            </div>
                          )}
                        </div>
                      </div>

                      {/* --- MENU ITEMS --- */}
                      <LinkItem icon={User} label="Profile" link="/profile" />
                      <LinkItem
                        icon={Wallet}
                        label="Airdops Portfolio"
                        link="/portfolio"
                      />

                      <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1" />
                    </>
                  )}

                  {/* --- DISCONNECT --- */}
                  <button
                    onClick={disconnect}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="size-4" />
                    <span>Disconnect</span>
                  </button>
                </div>
              </PopoverPanel>
            </Transition>
          </>
        )}
      </Popover>
    );
  }

  // --- 3. DISCONNECTED STATE ---
  return (
    <Modal
      bodyClass="max-w-sm"
      trigger={
        <button
          type="button"
          className={`px-5 py-2 text-sm font-semibold text-white bg-neutral-900 dark:bg-white dark:text-black rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all shadow-sm flex items-center gap-2 ${
            minimize ? "w-full justify-center" : ""
          }`}
        >
          <Wallet className="size-4" />
          {chain ? `Connect ${chain.toUpperCase()}` : "Connect Wallet"}
        </button>
      }
    >
      <ConnectModal chain={chain} />
    </Modal>
  );
};

export default WalletButton;
