import React, { useState, useMemo, lazy, Suspense, useEffect } from "react";
import useStorage from "context";
import { Check, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { clsx } from "clsx";
import { useWeb3 } from "components/web3/use-web3";
import { json, get } from "utils/request";
import { useWallet } from "hooks/use-query";
import { AssetNetworkConfig } from ".";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

const WalletButton = lazy(() => import("components/web3/connect-wallet"));

// Fetch AsterDEX deposit address
const fetchAsterDexAddress = async (coin: string, chainId: number): Promise<string | null> => {
  try {
    const network = chainId === 101 ? "SOLANA" : "EVM";
    const result = await get(`/asterdex/deposit-address?coin=${coin}&chainId=${chainId}&network=${network}`);
    if (result?.success) {
      // For Solana: use tokenVault, for EVM: use contractAddress or address
      if (chainId === 101 && result.tokenVault) {
        return result.tokenVault;
      }
      return result.contractAddress || result.address || null;
    }
    return null;
  } catch (err) {
    console.error("Error fetching AsterDEX address:", err);
    return null;
  }
};

const BUTTON_PRIMARY_CLASSES =
  "px-5 py-3 w-full justify-center text-sm font-semibold text-white bg-neutral-900 dark:bg-white dark:text-black rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";

const InputGroup = ({
  label,
  value,
  onChange,
  placeholder,
  rightElement,
  type = "text",
  helperText,
  error,
}: any) => (
  <div className="space-y-1.5">
    <label className="pl-1 text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
      {label}
    </label>
    <div
      className={clsx(
        "group relative flex items-center gap-3 rounded-xl border bg-gray-50 px-4 py-3 transition-all dark:bg-neutral-900/50",
        error
          ? "border-red-500 hover:border-red-600"
          : "border-neutral-200 hover:border-neutral-300 focus-within:border-neutral-900 focus-within:bg-white dark:border-neutral-800 dark:hover:border-neutral-700 dark:focus-within:border-white dark:focus-within:bg-neutral-900"
      )}
    >
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-transparent text-lg font-medium text-neutral-900 placeholder-neutral-400 outline-none dark:text-white dark:placeholder-neutral-600"
      />
      {rightElement && <div className="shrink-0">{rightElement}</div>}
    </div>
    <div className="flex justify-between px-1">
      {helperText && (
        <span className="text-[10px] font-medium text-neutral-400">
          {helperText}
        </span>
      )}
      {error && (
        <span className="ml-auto text-[10px] font-bold text-red-500">
          {error}
        </span>
      )}
    </div>
  </div>
);

// Map network chain/slug to AsterDEX chainId
const getAsterDexChainId = (network: any): number | null => {
  const chain = (network?.chain || network?.slug || "").toLowerCase();
  switch (chain) {
    case "bsc":
    case "bnb":
      return 56;
    case "eth":
    case "ethereum":
      return 1;
    case "arb":
    case "arbitrum":
      return 42161;
    case "sol":
    case "solana":
      return 101;
    default:
      return null;
  }
};

const Transfer = ({ modalType, asset, close }: any) => {
  const {
    setting: { token },
  } = useStorage();

  const { connection } = useConnection();
  const web3 = useWeb3();
  const { fetchWallet } = useWallet(false);
  const [selectedNetConfig, setSelectedNetConfig] =
    useState<AssetNetworkConfig | null>(null);
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [feedback, setFeedback] = useState("");
  
  // AsterDEX deposit address state
  const [asterDexAddress, setAsterDexAddress] = useState<string | null>(null);
  const [loadingAsterDex, setLoadingAsterDex] = useState(false);

  // Solana: show the *actual* receiving token account (may differ from the vault owner address)
  const [solanaReceiveAddress, setSolanaReceiveAddress] = useState<string | null>(null);
  const [loadingSolanaReceiveAddress, setLoadingSolanaReceiveAddress] = useState(false);
  const [solanaDepositAddressError, setSolanaDepositAddressError] = useState<string | null>(null);

  // Set default network when asset changes
  useEffect(() => {
    if (asset) {
      const activeNet = asset.networks.find((n: any) => n.isActive !== false && n.is_active !== false);
      setSelectedNetConfig(activeNet || asset.networks[0] || null);
    }
  }, [asset]);

  // Fetch AsterDEX deposit address when network changes (for deposits)
  useEffect(() => {
    if (modalType !== "deposit" || !selectedNetConfig || !asset) {
      setAsterDexAddress(null);
      return;
    }

    const chainId = getAsterDexChainId(selectedNetConfig.network);
    if (!chainId) {
      setAsterDexAddress(null);
      return;
    }

    const fetchAddress = async () => {
      setLoadingAsterDex(true);
      try {
        const addr = await fetchAsterDexAddress(asset.symbol, chainId);
        setAsterDexAddress(addr);
      } catch (err) {
        console.error("Error fetching AsterDEX address:", err);
        setAsterDexAddress(null);
      } finally {
        setLoadingAsterDex(false);
      }
    };

    fetchAddress();
  }, [modalType, selectedNetConfig?.id, asset?.symbol]);

  // Reset state when network changes
  useEffect(() => {
    setAmount("");
    setStatus("idle");
    setFeedback("");
  }, [selectedNetConfig?.id]);

  const handleTransaction = async () => {
    if (!selectedNetConfig || !asset) return;
    setStatus("processing");
    setFeedback("");

    await new Promise((resolve) => setTimeout(resolve, 300));

    try {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) throw new Error("Invalid amount");
      
      if (modalType === "deposit") {
        // DEPOSIT FLOW: User deposits directly to AsterDEX, backend credits wallet
        if (!asterDexAddress) {
          throw new Error("AsterDEX deposit address not available for this network");
        }

        const chainKey = (selectedNetConfig.network?.chain || selectedNetConfig.network?.slug || "")?.toLowerCase();
        const provider = (web3.wallets as any)[chainKey];

        if (!provider?.isConnected) throw new Error("Wallet not connected");

        // Get token contract address - check both snake_case and camelCase
        // This is the SPL token mint (Solana) or ERC20 contract address (EVM)
        const tokenAddress =
          selectedNetConfig.contract_address ||
          selectedNetConfig.contractAddress ||
          "";
        
        // Get decimals for proper amount calculation
        const tokenDecimals = selectedNetConfig.decimals ?? 18;

        // Debug log to verify correct values
        console.log("[Deposit Debug]", {
          chainKey,
          asterDexAddress,
          tokenAddress,
          tokenDecimals,
          amount,
          selectedNetConfig,
        });

        // Validate for SPL token transfers - tokenAddress is required
        if (chainKey === "solana" && !tokenAddress) {
          throw new Error("Token mint address not found for Solana SPL transfer");
        }

        // If the backend gave us a bad Solana deposit address, fail fast (do NOT send).
        if (chainKey === "solana" && solanaDepositAddressError) {
          throw new Error(solanaDepositAddressError);
        }

        // 1. Execute Blockchain Transaction directly to AsterDEX contract
        const txRes = await provider.deposit(
          asterDexAddress, // Deposit directly to AsterDEX - single tx, minimal fees
          amount,
          tokenAddress,
          tokenDecimals
        );

        if (!txRes.success) {
          throw new Error(txRes.error || "Blockchain transaction failed");
        }

        // 2. Call Backend API to record deposit and credit user wallet
        const apiRes: any = await json(
          "/wallet/deposit",
          {
            txId: txRes.hash,
            amount: numAmount,
            assetId: Number(asset.id),
            networkId: Number(selectedNetConfig.network.id),
            fromAddress: provider.address,
            // For Solana SPL transfers we may actually send to a token-account (ATA)
            // even if the provided vault address is a system account.
            toAddress: txRes.toAddress || asterDexAddress,
          },
          { token }
        );

        if (apiRes.success) {
          fetchWallet();
          setFeedback(`Success! Tx: ${txRes.hash.slice(0, 10)}...`);
          setStatus("success");
          setTimeout(() => close?.(), 2000);
        } else {
          throw new Error(apiRes.error || "Failed to record deposit");
        }
      } else {
        // --- WITHDRAW FLOW ---
        const avail = asset.balance - asset.locked;
        if (numAmount > avail) throw new Error("Insufficient balance");
        if (numAmount < selectedNetConfig.minWithdraw) {
          throw new Error(
            `Minimum withdrawal is ${selectedNetConfig.minWithdraw} ${asset.symbol}`
          );
        }
        if (!address) throw new Error("Enter destination address");

        const apiRes: any = await json(
          "wallet/withdraw",
          {
            assetId: Number(asset.id),
            networkId: Number(selectedNetConfig.network.id),
            amount: numAmount,
            toAddress: address,
          },
          { token }
        );

        if (apiRes.success) {
          fetchWallet();
          setStatus("success");
          setFeedback("Withdrawal requested successfully");
          setTimeout(() => close?.(), 2000);
        } else {
          throw new Error(apiRes.error || "Withdrawal failed");
        }
      }
    } catch (e: any) {
      console.error(e);
      setStatus("error");
      setFeedback(e.message || "An unknown error occurred");
    }
  };

  // Get Chain Key for wallet connection
  const currentChainKey = useMemo(() => {
    if (!selectedNetConfig) return null;
    return (selectedNetConfig.network.chain || selectedNetConfig.network.slug)?.toLowerCase();
  }, [selectedNetConfig]);

  const resolvedTokenAddress = useMemo(() => {
    if (!selectedNetConfig) return "";
    return selectedNetConfig.contract_address || selectedNetConfig.contractAddress || "";
  }, [selectedNetConfig]);

  // Compute Solana actual receiving token account (to match what we send on-chain)
  useEffect(() => {
    const run = async () => {
      if (modalType !== "deposit") {
        setSolanaReceiveAddress(null);
        setSolanaDepositAddressError(null);
        return;
      }

      if (currentChainKey !== "solana") {
        setSolanaReceiveAddress(null);
        setSolanaDepositAddressError(null);
        return;
      }

      if (!asterDexAddress || !resolvedTokenAddress) {
        setSolanaReceiveAddress(null);
        setSolanaDepositAddressError(null);
        return;
      }

      setLoadingSolanaReceiveAddress(true);
      try {
        const recipientKey = new PublicKey(asterDexAddress);
        const recipientInfo = await connection.getAccountInfo(recipientKey);

        if (!recipientInfo) {
          setSolanaReceiveAddress(null);
          setSolanaDepositAddressError(
            "Invalid Solana deposit address (not found on-chain). Please refresh the deposit address."
          );
          return;
        }

        if (!recipientInfo.owner?.equals(TOKEN_PROGRAM_ID)) {
          setSolanaReceiveAddress(null);
          setSolanaDepositAddressError(
            "Invalid Solana deposit address (expected token vault / token account). Please refresh the deposit address."
          );
          return;
        }

        // For SPL deposits we always send directly to the token vault.
        setSolanaReceiveAddress(asterDexAddress);
        setSolanaDepositAddressError(null);
      } catch {
        setSolanaReceiveAddress(null);
        setSolanaDepositAddressError("Unable to validate Solana deposit address. Please try again.");
      } finally {
        setLoadingSolanaReceiveAddress(false);
      }
    };

    run();
  }, [modalType, currentChainKey, asterDexAddress, resolvedTokenAddress, connection]);

  // Check Wallet Connection
  const isWalletConnected = useMemo(() => {
    if (!currentChainKey || !web3.wallets) return false;
    return (web3.wallets as any)[currentChainKey]?.isConnected;
  }, [currentChainKey, web3.wallets]);

  // Check Withdrawal Balance
  const isBalanceInsufficient = useMemo(() => {
    if (!asset || modalType !== "withdraw") return false;
    const avail = asset.balance - asset.locked;
    return parseFloat(amount || "0") > avail;
  }, [amount, asset, modalType]);

  // Check Deposit Minimum
  const isDepositBelowMinimum = useMemo(() => {
    if (!selectedNetConfig || modalType !== "deposit") return false;
    const numAmount = parseFloat(amount || "0");
    const minDeposit = selectedNetConfig.minDeposit ?? selectedNetConfig.min_deposit ?? 0;
    return numAmount > 0 && numAmount < minDeposit;
  }, [amount, selectedNetConfig, modalType]);

  // Can proceed with deposit?
  const canDeposit = useMemo(() => {
    if (modalType !== "deposit") return true;
    
    const numAmount = parseFloat(amount || "0");
    const minDeposit = selectedNetConfig?.minDeposit ?? selectedNetConfig?.min_deposit ?? 0;
    
    const baseOk =
      isWalletConnected &&
      asterDexAddress &&
      !loadingAsterDex &&
      numAmount > 0 &&
      numAmount >= minDeposit; // Block if below minimum

    if (currentChainKey === "solana") {
      return baseOk && !loadingSolanaReceiveAddress && !solanaDepositAddressError;
    }

    return baseOk;
  }, [
    modalType,
    isWalletConnected,
    asterDexAddress,
    loadingAsterDex,
    amount,
    selectedNetConfig,
    currentChainKey,
    loadingSolanaReceiveAddress,
    solanaDepositAddressError,
  ]);

  if (!asset || !selectedNetConfig) {
    return <div className="py-8 text-center text-neutral-500">Loading...</div>;
  }

  return (
    <div className="px-1 pt-1">
      {/* Modal Header */}
      <div className="mb-6 flex items-center justify-start gap-4 border-b border-neutral-100 pb-4 dark:border-neutral-800">
        <img src={asset.logo} className="size-12 rounded-full" alt={asset.symbol} />
        <div>
          <h2 className="text-xl font-bold">
            {modalType === "deposit" ? "Deposit" : "Withdraw"} {asset.symbol}
          </h2>
          <p className="text-xs text-neutral-500">
            {modalType === "deposit"
              ? "Direct to AsterDEX • Minimal fees"
              : "Enter destination & amount"}
          </p>
        </div>
      </div>

      {/* Network Selector */}
      <div className="mb-6">
        <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-neutral-500">
          Network
        </label>
        <div className="scrollbar-none flex gap-2 overflow-x-auto pb-2">
          {asset.networks
            .filter((net: any) => {
              const isActive = net.isActive !== false && net.is_active !== false;
              const networkActive = net.network?.isActive !== false && net.network?.is_active !== false;
              return isActive && networkActive;
            })
            .map((net: any) => (
              <button
                key={net.id}
                onClick={() => setSelectedNetConfig(net)}
                className={clsx(
                  "group flex shrink-0 items-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold transition-all",
                  selectedNetConfig.id === net.id
                    ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-black"
                    : "border-neutral-200 bg-white text-neutral-500 hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                )}
              >
                <img src={net.network.logo} className="size-5 rounded-full" alt={net.network.name} />
                {net.network.name}
                {selectedNetConfig.id === net.id && <Check className="ml-1 size-3" />}
              </button>
            ))}
        </div>
      </div>

      <div className="space-y-6">
        {modalType === "deposit" ? (
          <>
            {/* AsterDEX Deposit Address Info */}
            <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <ExternalLink className="size-4 text-blue-400" />
                <span className="text-xs font-bold text-blue-400">
                  AsterDEX Deposit Address
                </span>
              </div>
              {loadingAsterDex ? (
                <div className="flex items-center gap-2 py-2">
                  <Loader2 className="size-4 animate-spin text-blue-400" />
                  <span className="text-sm text-neutral-400">Loading...</span>
                </div>
              ) : asterDexAddress ? (
                <div className="space-y-2">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      {currentChainKey === "solana"
                        ? "Token vault (receiving account)"
                        : "Deposit address"}
                    </div>
                    <p className="break-all font-mono text-sm text-white">{asterDexAddress}</p>
                  </div>

                  {currentChainKey === "solana" && resolvedTokenAddress ? (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        Receiving token account
                      </div>
                      {loadingSolanaReceiveAddress ? (
                        <div className="flex items-center gap-2 py-1">
                          <Loader2 className="size-3 animate-spin text-blue-400" />
                          <span className="text-xs text-neutral-400">Calculating…</span>
                        </div>
                      ) : solanaDepositAddressError ? (
                        <p className="text-xs text-red-400">{solanaDepositAddressError}</p>
                      ) : solanaReceiveAddress ? (
                        <p className="break-all font-mono text-sm text-white">{solanaReceiveAddress}</p>
                      ) : (
                        <p className="text-xs text-neutral-400">Unavailable</p>
                      )}
                      <p className="mt-1 text-[10px] text-neutral-500">
                        For Solana USDC/USDT deposits we only allow sending to the AsterDEX token vault (token account).
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-red-400">Not available for this network</p>
              )}
              <p className="mt-2 text-[10px] text-neutral-500">
                Funds sent here go directly to AsterDEX for trading
              </p>
            </div>

            {/* WEB3 CONNECT SECTION */}
            <div className="rounded-2xl border border-neutral-200 bg-gray-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-500">1. Connect Wallet</span>
                <span className="rounded bg-neutral-200 px-2 py-1 text-[10px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                  {selectedNetConfig.network.name}
                </span>
              </div>
              <Suspense
                fallback={
                  <div className="py-4 text-center text-xs text-neutral-500">
                    Loading Adapter...
                  </div>
                }
              >
                <div className="[&>button]:w-full [&>button]:rounded-xl [&>button]:bg-black [&>button]:py-3 [&>button]:font-bold [&>button]:text-white [&>button]:hover:opacity-90 dark:[&>button]:bg-white dark:[&>button]:text-black">
                  <WalletButton minimize={true} chain={currentChainKey as any} />
                </div>
              </Suspense>
            </div>

            {/* Amount Input */}
            <InputGroup
              label="2. Amount"
              placeholder="0.00"
              value={amount}
              onChange={(e: any) => setAmount(e.target.value)}
              type="number"
              rightElement={<span className="font-bold">{asset.symbol}</span>}
              helperText={`Min: ${selectedNetConfig.minDeposit ?? selectedNetConfig.min_deposit ?? 0} ${asset.symbol}`}
              error={isDepositBelowMinimum ? `Minimum deposit is ${selectedNetConfig.minDeposit ?? selectedNetConfig.min_deposit ?? 0} ${asset.symbol}` : ""}
            />
          </>
        ) : (
          /* WITHDRAW SECTION */
          <>
            <InputGroup
              label="Destination Address"
              placeholder={`Paste ${selectedNetConfig.network.name} address`}
              value={address}
              onChange={(e: any) => setAddress(e.target.value)}
            />

            <InputGroup
              label="Amount"
              placeholder="0.00"
              value={amount}
              onChange={(e: any) => setAmount(e.target.value)}
              type="number"
              rightElement={
                <button
                  onClick={() => setAmount((asset.balance - asset.locked).toString())}
                  className="text-xs font-bold text-neutral-900 underline decoration-neutral-400 underline-offset-4 dark:text-white"
                >
                  MAX
                </button>
              }
              error={isBalanceInsufficient ? "Insufficient Balance" : ""}
              helperText={`Available: ${(asset.balance - asset.locked).toFixed(4)} ${asset.symbol}`}
            />
          </>
        )}

        {/* STATUS FEEDBACK */}
        {(status === "error" || status === "success") && (
          <div
            className={clsx(
              "flex items-start gap-3 rounded-xl border p-4 text-xs font-medium",
              status === "error"
                ? "border-red-200 bg-red-50 text-red-600 dark:border-red-900/50 dark:bg-red-900/10 dark:text-red-400"
                : "border-green-200 bg-green-50 text-green-600 dark:border-green-900/50 dark:bg-green-900/10 dark:text-green-400"
            )}
          >
            {status === "error" ? (
              <AlertCircle className="size-5 shrink-0" />
            ) : (
              <Check className="size-5 shrink-0" />
            )}
            <div className="break-all">
              <p className="mb-1 font-bold">{status === "error" ? "Failed" : "Success"}</p>
              <p className="opacity-90">{feedback}</p>
            </div>
          </div>
        )}

        {/* MAIN ACTION BUTTON */}
        {modalType === "deposit" ? (
          isWalletConnected && asterDexAddress ? (
            <button
              onClick={handleTransaction}
              disabled={status === "processing" || status === "success" || !canDeposit}
              className={BUTTON_PRIMARY_CLASSES}
            >
              {status === "processing" ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Deposit"
              )}
            </button>
          ) : null
        ) : (
          <button
            onClick={handleTransaction}
            disabled={
              status === "processing" ||
              status === "success" ||
              isBalanceInsufficient ||
              !address
            }
            className={BUTTON_PRIMARY_CLASSES}
          >
            {status === "processing" ? "Processing..." : "Confirm Withdrawal"}
          </button>
        )}
      </div>
    </div>
  );
};

export default Transfer;
