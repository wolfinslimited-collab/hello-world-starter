/**
 * Wallet Connect Button
 * Unified component for wallet connection and authentication
 */
import React, { useState, useEffect, Fragment, useMemo, useCallback } from "react";
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react";
import { User, Wallet, LogOut, ChevronDown, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import Modal from "components/specific/modal";
import ConnectModal from "./connect-modal";
import { useWeb3 } from "./use-web3";
import useStorage from "context";
import useAuth from "hooks/use-auth";

// Helper component for dropdown links
const MenuLink = ({ icon: Icon, label, link }: { icon: any; label: string; link: string }) => (
  <Link
    to={link}
    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted transition-colors"
  >
    <Icon className="size-4 text-muted-foreground" />
    <span>{label}</span>
  </Link>
);

interface WalletConnectButtonProps {
  chain?: "eth" | "bsc" | "solana" | "arbitrum";
  minimize?: boolean;
}

export function WalletConnectButton({ chain, minimize = false }: WalletConnectButtonProps) {
  const { app: { ref }, setting } = useStorage();
  const { login, logout, isLoading: isAuthLoading, isAuthenticated } = useAuth();
  const web3 = useWeb3();

  const [isSigning, setIsSigning] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Derive active wallet based on chain prop or auto-detect
  const activeWallet = useMemo(() => {
    if (chain && web3.wallets[chain]) {
      return web3.wallets[chain];
    }
    switch (web3.activeChain) {
      case "ETH": return web3.wallets.eth;
      case "BSC": return web3.wallets.bsc;
      case "ARB": return web3.wallets.arbitrum;
      case "SOLANA": return web3.wallets.solana;
      case "TRON": return web3.wallets.tron;
      default: return null;
    }
  }, [chain, web3.activeChain, web3.wallets]);

  // Get all connected wallets for the dropdown
  const connectedWallets = useMemo(() => {
    if (!web3?.wallets) return [];
    return Object.entries(web3.wallets)
      .filter(([_, wallet]: [string, any]) => wallet.isConnected)
      .map(([key, wallet]: [string, any]) => ({
        chainKey: key,
        name: key.toUpperCase(),
        address: wallet.addressShort,
        fullAddress: wallet.address,
      }));
  }, [web3.wallets]);

  // Handle authentication after wallet connects
  const handleAuth = useCallback(async () => {
    if (!activeWallet?.isConnected || isAuthenticated || isSigning) return;

    setIsSigning(true);
    try {
      console.log(`🔐 Requesting signature for ${chain || web3.activeChain}...`);
      
      const signResult = await activeWallet.signLoginMessage(
        "Welcome to the DEX! Please sign this message to verify your wallet ownership."
      );

      if (!signResult.success) {
        console.error("Signature failed:", signResult.error);
        activeWallet.disconnect();
        return;
      }

      const authResult = await login({
        chain: chain?.toUpperCase() || web3.activeChain,
        address: activeWallet.address!,
        signature: signResult.signature!,
        refId: ref,
      });

      if (!authResult.success) {
        console.error("Auth failed:", authResult.error);
        activeWallet.disconnect();
      } else {
        setModalOpen(false);
      }
    } catch (err) {
      console.error("Auth error:", err);
      activeWallet.disconnect();
    } finally {
      setIsSigning(false);
    }
  }, [activeWallet, isAuthenticated, isSigning, chain, web3.activeChain, ref, login]);

  // Auto-authenticate when wallet connects
  useEffect(() => {
    if (activeWallet?.isConnected && !isAuthenticated && !isSigning) {
      handleAuth();
    }
  }, [activeWallet?.isConnected, isAuthenticated]);

  // Reset state when wallet disconnects
  useEffect(() => {
    const isConnected = chain ? activeWallet?.isConnected : web3.isConnected;
    if (!isConnected && isAuthenticated) {
      // Wallet disconnected externally
    }
  }, [web3.isConnected, activeWallet?.isConnected, chain]);

  // Disconnect all wallets and logout
  const handleDisconnect = useCallback(() => {
    if (web3.wallets) {
      Object.values(web3.wallets).forEach((wallet: any) => {
        if (wallet?.isConnected && typeof wallet.disconnect === "function") {
          try {
            wallet.disconnect();
          } catch (e) {
            console.error("Disconnect error:", e);
          }
        }
      });
    }
    logout();
  }, [web3.wallets, logout]);

  // Loading state
  if (isSigning || isAuthLoading) {
    return (
      <button
        className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold text-muted-foreground bg-muted rounded-lg cursor-wait transition-all ${
          minimize ? "w-full justify-center" : ""
        }`}
        disabled
      >
        <Loader2 className="size-4 animate-spin" />
        <span>Verifying...</span>
      </button>
    );
  }

  // Connected state
  if (activeWallet?.isConnected && isAuthenticated) {
    return (
      <Popover className={`relative ${minimize ? "w-full" : ""}`}>
        <PopoverButton
          className={`outline-none focus:ring-2 focus:ring-ring rounded-lg ${
            minimize ? "w-full" : ""
          }`}
        >
          <div
            className={`flex items-center gap-2 py-1.5 px-3 rounded-xl border border-white/5 bg-neutral-900 hover:bg-neutral-800 transition-all shadow-sm ${
              minimize ? "w-full justify-between" : ""
            }`}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="flex h-2 w-2 min-w-[0.5rem] rounded-full bg-green-500 ring-2 ring-green-500/20" />
              <div
                className={`text-sm font-medium text-foreground ${
                  minimize ? "truncate" : "hidden sm:block"
                }`}
              >
                {minimize ? activeWallet.address : activeWallet.addressShort}
              </div>
            </div>
            <ChevronDown className="size-4 text-muted-foreground shrink-0" strokeWidth={2} />
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
            className={`absolute right-0 z-[200] mt-2 origin-top-right rounded-xl border border-white/5 bg-neutral-900 shadow-xl focus:outline-none p-1 ${
              minimize ? "w-md" : "w-64"
            }`}
          >
            <div className="p-2 space-y-1">
              {!minimize && (
                <>
                  {/* Connected Networks */}
                  <div className="mb-2 overflow-hidden rounded-lg border border-white/5">
                    <div className="bg-muted px-3 py-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Connected Networks
                      </span>
                    </div>
                    <div className="divide-y divide-border bg-card">
                      {connectedWallets.length > 0 ? (
                        connectedWallets.map((wallet) => {
                          const isActive = wallet.chainKey === (chain || web3.activeChain)?.toLowerCase();
                          return (
                            <div
                              key={wallet.chainKey}
                              className="flex items-center justify-between px-3 py-2.5 hover:bg-muted transition-colors"
                            >
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`size-1.5 rounded-full ${
                                    isActive
                                      ? "bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.5)]"
                                      : "bg-muted-foreground/50"
                                  }`}
                                />
                                <span
                                  className={`text-xs font-bold uppercase ${
                                    isActive ? "text-foreground" : "text-muted-foreground"
                                  }`}
                                >
                                  {wallet.name}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {wallet.address}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="px-3 py-2 text-xs text-muted-foreground italic">
                          No active connections
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Menu Items */}
                  <MenuLink icon={User} label="Profile" link="/profile" />
                  <MenuLink icon={Wallet} label="Airdrop Portfolio" link="/portfolio" />

                  <div className="h-px bg-border my-1" />
                </>
              )}

              {/* Disconnect Button */}
              <button
                onClick={handleDisconnect}
                className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="size-4" />
                <span>Disconnect</span>
              </button>
            </div>
          </PopoverPanel>
        </Transition>
      </Popover>
    );
  }

  // Disconnected state
  return (
    <Modal
      bodyClass="max-w-sm"
      open={modalOpen}
      onClose={() => setModalOpen(false)}
      trigger={
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className={`px-5 py-2 text-sm font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-all shadow-sm flex items-center gap-2 ${
            minimize ? "w-full justify-center" : ""
          }`}
        >
          <Wallet className="size-4" />
          {chain ? `Connect ${chain.toUpperCase()}` : "Connect Wallet"}
        </button>
      }
    >
      <ConnectModal chain={chain} onClose={() => setModalOpen(false)} />
    </Modal>
  );
}

export default WalletConnectButton;
