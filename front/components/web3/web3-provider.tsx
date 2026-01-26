import React, {
  JSX,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

// --- EVM IMPORTS (ConnectKit) ---
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, polygon, bsc, arbitrum } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";

// --- SOLANA IMPORTS ---
import "@solana/wallet-adapter-react-ui/styles.css";
import {
  ConnectionProvider,
  WalletProvider as SolProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider as SolModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";

// --- TRON IMPORTS ---
import "@tronweb3/tronwallet-adapter-react-ui/style.css";
import { WalletProvider as TronProvider } from "@tronweb3/tronwallet-adapter-react-hooks";
import { WalletModalProvider as TronModalProvider } from "@tronweb3/tronwallet-adapter-react-ui";
import { TronLinkAdapter } from "@tronweb3/tronwallet-adapters";
import { walletConnect } from "wagmi/connectors";

// 1. SETUP EVM (ConnectKit)
// We use the public Cloudflare ID for testing to avoid "Invalid ID" errors.
const evmConfig = createConfig(
  getDefaultConfig({
    // Your dApps chains
    chains: [mainnet, polygon, bsc, arbitrum],
    transports: {
      [mainnet.id]: http(),
      [polygon.id]: http(),
      [bsc.id]: http(),
      [arbitrum.id]: http(),
    },
    connectors: [
      walletConnect({
        projectId: "ab59362e684f3c75ba81ffcddc2cec8d",
      }),
    ],
    walletConnectProjectId: "ab59362e684f3c75ba81ffcddc2cec8d",
    appName: "Timetrade",
    appDescription: "Next-Gen AI DEX",
    appUrl: "https://timetrade.com",
    appIcon: "https://timetrade.com/xlogo.png",
  })
);

const queryClient = new QueryClient();

// 2. SETUP SOLANA
const SOLANA_ENDPOINT = "https://solana-rpc.publicnode.com";

export const Web3Provider = ({ children }: { children: ReactNode }) => {
  const solWallets = useMemo(() => [new PhantomWalletAdapter()], []);
  const tronWallets = useMemo(() => [new TronLinkAdapter()], []);

  return (
    <WagmiProvider config={evmConfig}>
      <QueryClientProvider client={queryClient}>
        {/* ConnectKit Provider wraps everything */}
        <ConnectKitProvider mode="dark">
          <ConnectionProvider endpoint={SOLANA_ENDPOINT}>
            <SolProvider wallets={solWallets} autoConnect>
              <SolModalProvider>
                <TronProvider adapters={tronWallets} autoConnect>
                  <TronModalProvider>{children}</TronModalProvider>
                </TronProvider>
              </SolModalProvider>
            </SolProvider>
          </ConnectionProvider>
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
