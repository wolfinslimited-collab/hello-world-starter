import React, { useState, useMemo, lazy, Suspense, useEffect } from "react";
import useStorage from "context";
import { Check, AlertCircle, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { useWeb3 } from "components/web3/use-web3";
import { json } from "utils/request";
import { useWallet } from "hooks/use-query";
import { AssetNetworkConfig } from ".";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";

const WalletButton = lazy(() => import("components/web3/connect-wallet"));

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
  bottomElement,
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
    {bottomElement}
  </div>
);

const Transfer = ({ modalType, asset, close }: any) => {
  const {
    setting: { token },
  } = useStorage();

  const web3 = useWeb3();
  const { connection } = useConnection();
  const { fetchWallet } = useWallet(false);
  const [selectedNetConfig, setSelectedNetConfig] =
    useState<AssetNetworkConfig | null>(null);
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [feedback, setFeedback] = useState("");
  
  // Blockchain balance state
  const [blockchainBalance, setBlockchainBalance] = useState<string | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // 1. Get Chain Key - normalize to match web3.wallets keys
  // Note: API returns 'chain' property, not 'slug'
  const currentChainKey = useMemo(() => {
    if (!selectedNetConfig) return null;
    const chain = (selectedNetConfig.network.chain || selectedNetConfig.network.slug)?.toLowerCase();
    // Map chain values to web3.wallets keys
    if (chain === "sol" || chain === "solana") return "solana";
    if (chain === "eth" || chain === "ethereum") return "eth";
    if (chain === "bsc" || chain === "binance") return "bsc";
    if (chain === "tron" || chain === "trx") return "tron";
    return chain;
  }, [selectedNetConfig]);

  // Get current wallet provider
  const currentWallet = useMemo(() => {
    if (!currentChainKey || !web3.wallets) return null;
    return (web3.wallets as any)[currentChainKey] || null;
  }, [currentChainKey, web3.wallets]);

  // Determine whether *any* wallet is connected (even if on the wrong network)
  const isAnyWalletConnected = web3?.isConnected === true;

  // What chain do we expect, based on the selected deposit network?
  const expectedActiveChain = useMemo(() => {
    if (!currentChainKey) return null;
    if (currentChainKey === "solana") return "SOLANA";
    if (currentChainKey === "tron") return "TRON";
    if (currentChainKey === "eth") return "ETH";
    if (currentChainKey === "bsc") return "BSC";
    return null;
  }, [currentChainKey]);

  // 2. Check Wallet Connection
  // IMPORTANT: for EVM wallets, your useWeb3 marks eth/bsc as connected ONLY when chain.id matches.
  // If the user is connected on a different EVM chain, we should show "Switch network" instead of "Connect".
  const isWalletConnected = useMemo(() => {
    if (!expectedActiveChain) return false;
    return web3?.activeChain === expectedActiveChain;
  }, [expectedActiveChain, web3?.activeChain]);

  const needsNetworkSwitch = useMemo(() => {
    if (!expectedActiveChain) return false;
    return isAnyWalletConnected && !isWalletConnected;
  }, [expectedActiveChain, isAnyWalletConnected, isWalletConnected]);

  // Fetch blockchain balance when wallet is connected
  useEffect(() => {
    const fetchBlockchainBalance = async () => {
      if (!isWalletConnected || !currentWallet || !selectedNetConfig) {
        setBlockchainBalance(null);
        return;
      }

      setLoadingBalance(true);
      try {
        // For Solana
        if (currentChainKey === "solana" && currentWallet.address) {
          const pubKey = new PublicKey(currentWallet.address);
          
          if (selectedNetConfig.contractAddress) {
            // SPL Token balance
            const mintKey = new PublicKey(selectedNetConfig.contractAddress);
            try {
              const tokenAccount = await getAssociatedTokenAddress(mintKey, pubKey);
              const accountInfo = await getAccount(connection, tokenAccount);
              const balance = Number(accountInfo.amount) / Math.pow(10, selectedNetConfig.decimals);
              setBlockchainBalance(balance.toFixed(selectedNetConfig.decimals > 4 ? 4 : selectedNetConfig.decimals));
            } catch {
              setBlockchainBalance("0.00");
            }
          } else {
            // Native SOL balance
            const balance = await connection.getBalance(pubKey);
            setBlockchainBalance((balance / 1e9).toFixed(4));
          }
        } else {
          // For EVM chains, we would need to add balance fetching logic
          // For now, show N/A
          setBlockchainBalance(null);
        }
      } catch (err) {
        console.error("Error fetching blockchain balance:", err);
        setBlockchainBalance(null);
      } finally {
        setLoadingBalance(false);
      }
    };

    fetchBlockchainBalance();
  }, [isWalletConnected, currentWallet, selectedNetConfig, currentChainKey, connection]);

  const handleTransaction = async () => {
    if (!selectedNetConfig || !asset) return;
    setStatus("processing");
    setFeedback("");

    // Optional delay for UI feeling
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) throw new Error("Invalid amount");
      if (modalType === "deposit") {
        // Support both snake_case (API) and camelCase formats
        const minDepositValue = (selectedNetConfig as any).min_deposit ?? selectedNetConfig.minDeposit ?? 0;
        if (numAmount < minDepositValue)
          throw new Error(
            `Minimum deposit is ${minDepositValue} ${asset.symbol}`
          );

        // Use chain property (API returns 'chain', not 'slug')
        const chain = (selectedNetConfig.network.chain || selectedNetConfig.network.slug)?.toLowerCase();
        if (!chain) throw new Error("Network chain not configured");
        
        let normalizedChainKey: string = chain;
        if (chain === "sol" || chain === "solana") normalizedChainKey = "solana";
        else if (chain === "eth" || chain === "ethereum") normalizedChainKey = "eth";
        else if (chain === "bsc" || chain === "binance") normalizedChainKey = "bsc";
        else if (chain === "tron" || chain === "trx") normalizedChainKey = "tron";

        const provider = (web3.wallets as any)[normalizedChainKey];

        if (!provider?.isConnected) throw new Error("Wallet not connected");

        // Get deposit address (API uses snake_case main_address)
        const depositAddress = selectedNetConfig.network.main_address || selectedNetConfig.network.mainAddress;

        // 1. Execute Blockchain Transaction
        const txRes = await provider.deposit(
          depositAddress,
          amount,
          selectedNetConfig.contractAddress,
          selectedNetConfig.decimals
        );

        if (!txRes.success)
          throw new Error(txRes.error || "Blockchain transaction failed");

        // 2. Call Backend API to record deposit
        const apiRes: any = await json(
          "/wallet/deposit",
          {
            txId: txRes.hash,
            amount: numAmount,
            assetId: Number(asset.id),
            networkId: Number(selectedNetConfig.network.id),
            fromAddress: provider.address,
          },
          { token }
        );

        if (apiRes.success) {
          fetchWallet();
          setFeedback(`Success! Ref: ${txRes.hash.slice(0, 8)}...`);
          setStatus("success");
          close?.();
        }
      } else {
        // --- WITHDRAW FLOW ---
        const avail = asset.balance - asset.locked;
        if (numAmount > avail) throw new Error("Insufficient balance");
        if (numAmount < selectedNetConfig.minWithdraw)
          throw new Error(
            `Minimum withdrawal is ${selectedNetConfig.minWithdraw} ${asset.symbol}`
          );
        if (!address) throw new Error("Invalid destination address");

        // 1. Call Backend API to request withdraw
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
          close();
        }
      }
    } catch (e: any) {
      console.error(e);
      setStatus("error");
      setFeedback(e.message || "An unknown error occurred");
    }
  };

  // 3. Check Withdrawal Balance
  const isBalanceInsufficient = useMemo(() => {
    if (!asset || modalType !== "withdraw") return false;
    const avail = asset.balance - asset.locked;
    return parseFloat(amount || "0") > avail;
  }, [amount, asset, modalType]);

  // Check if deposit amount exceeds blockchain balance
  const isBlockchainBalanceInsufficient = useMemo(() => {
    if (!blockchainBalance || modalType !== "deposit") return false;
    return parseFloat(amount || "0") > parseFloat(blockchainBalance);
  }, [amount, blockchainBalance, modalType]);

  useEffect(() => {
    if (asset) {
      setSelectedNetConfig(
        asset.networks.find((n: any) => n.isActive) || asset.networks[0] || null
      );
    }
  }, [asset]);

  // Reset amount when network changes
  useEffect(() => {
    setAmount("");
    setStatus("idle");
    setFeedback("");
  }, [selectedNetConfig?.id]);

  return (
    <>
      <div className={asset ? "" : "py-4"}>
        {asset && selectedNetConfig && (
          <div className="px-1 pt-1">
            {/* Modal Header */}
            <div className="mb-6 flex items-center justify-start gap-4 border-b border-neutral-100 pb-4 dark:border-neutral-800">
              <img src={asset.logo} className="size-12 rounded-full" />

              <div>
                <h2 className="text-xl font-bold">
                  {modalType === "deposit" ? "Deposit" : "Withdraw"}{" "}
                  {asset.symbol}
                </h2>
                <p className="text-xs text-neutral-500">
                  {modalType === "deposit"
                    ? "Select network & connect wallet"
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
                {asset.networks.map((net: any) => (
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
                    <img
                      src={net.network.logo}
                      className="size-5 rounded-full"
                    />
                    {net.network.name}
                    {selectedNetConfig.id === net.id && (
                      <Check className="ml-1 size-3" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {modalType === "deposit" ? (
                <>
                  {/* WEB3 CONNECT SECTION */}
                  <div
                    className={clsx(
                      "rounded-2xl border p-4",
                      "border-neutral-200 bg-gray-50 dark:border-neutral-800 dark:bg-neutral-900"
                    )}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-500">
                        1. Connect Wallet
                      </span>
                      <span className="rounded bg-neutral-200 px-2 py-1 text-[10px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                        {selectedNetConfig.network.type}
                      </span>
                    </div>

                    {/* Lazy Loaded Wallet Button */}
                    <Suspense
                      fallback={
                        <div className="py-4 text-center text-xs text-neutral-500">
                          Loading Adapter...
                        </div>
                      }
                    >
                      <div className="[&>button]:w-full [&>button]:rounded-xl [&>button]:bg-black [&>button]:py-3 [&>button]:font-bold [&>button]:text-white [&>button]:hover:opacity-90 dark:[&>button]:bg-white dark:[&>button]:text-black">
                        <WalletButton
                          minimize={true}
                          chain={currentChainKey as any}
                        />
                      </div>
                    </Suspense>
                  </div>

                  <InputGroup
                    label="2. Amount"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e: any) => setAmount(e.target.value)}
                    type="number"
                    rightElement={
                      <div className="flex items-center gap-2">
                        {blockchainBalance && parseFloat(blockchainBalance) > 0 && (
                          <button
                            onClick={() => setAmount(blockchainBalance)}
                            className="text-xs font-bold text-emerald-500 hover:text-emerald-400 transition-colors"
                          >
                            MAX
                          </button>
                        )}
                        <span className="font-bold">{asset.symbol}</span>
                      </div>
                    }
                    helperText={`Min Deposit: ${(selectedNetConfig as any).min_deposit ?? selectedNetConfig.minDeposit ?? 0} ${asset.symbol}`}
                    error={isBlockchainBalanceInsufficient ? "Insufficient wallet balance" : ""}
                  />
                  
                  {/* Always show blockchain balance section under amount input */}
                  <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/50 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        Wallet Balance
                      </span>
                       {!expectedActiveChain ? (
                         <span className="text-xs text-neutral-400">Unsupported network</span>
                       ) : !isAnyWalletConnected ? (
                         <span className="text-xs text-neutral-400">Connect wallet to view</span>
                       ) : needsNetworkSwitch ? (
                         <span className="text-xs text-neutral-400">Switch to {expectedActiveChain} to view</span>
                      ) : loadingBalance ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="size-3 animate-spin text-neutral-400" />
                          <span className="text-xs text-neutral-400">Loading...</span>
                        </div>
                      ) : (
                        <span className="text-sm font-semibold text-emerald-500">
                          {blockchainBalance ?? "0.00"} {asset.symbol}
                        </span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* WITHDRAW SECTION */
                <>
                  <InputGroup
                    label="Destination Address"
                    placeholder={`Paste ${selectedNetConfig.network.name} Address`}
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
                        onClick={() =>
                          setAmount((asset.balance - asset.locked).toString())
                        }
                        className="text-xs font-bold text-neutral-900 underline decoration-neutral-400 underline-offset-4 dark:text-white"
                      >
                        MAX
                      </button>
                    }
                    error={isBalanceInsufficient ? "Insufficient Balance" : ""}
                    helperText={`Available: ${(
                      asset.balance - asset.locked
                    ).toFixed(4)} ${asset.symbol}`}
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
                    <p className="mb-1 font-bold">
                      {status === "error" ? "Failed" : "Success"}
                    </p>
                    <p className="opacity-90">{feedback}</p>
                  </div>
                </div>
              )}

              {/* MAIN ACTION BUTTON - Always show for deposit, with proper disabled state */}
              {modalType === "deposit" ? (
                <button
                  onClick={handleTransaction}
                  disabled={
                     !isWalletConnected ||
                    status === "processing" ||
                    status === "success" ||
                    !amount ||
                    parseFloat(amount || "0") <= 0 ||
                    isBlockchainBalanceInsufficient
                  }
                  className={BUTTON_PRIMARY_CLASSES}
                >
                  {status === "processing" ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Processing...
                    </>
                   ) : !expectedActiveChain ? (
                     "Unsupported Network"
                   ) : !isAnyWalletConnected ? (
                     "Connect Wallet First"
                   ) : needsNetworkSwitch ? (
                     `Switch to ${expectedActiveChain}`
                  ) : !amount || parseFloat(amount || "0") <= 0 ? (
                    "Enter Amount"
                  ) : (
                    `Deposit ${amount} ${asset.symbol}`
                  )}
                </button>
              ) : (
                <button
                  onClick={handleTransaction}
                  disabled={
                    status === "processing" ||
                    status === "success" ||
                    isBalanceInsufficient ||
                    !amount ||
                    !address
                  }
                  className={BUTTON_PRIMARY_CLASSES}
                >
                  {status === "processing" ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Confirm Withdrawal"
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Transfer;
