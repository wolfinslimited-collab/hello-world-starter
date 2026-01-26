import React, { useState, useMemo, lazy, Suspense, useEffect } from "react";
import useStorage from "context";
import { Check, AlertCircle } from "lucide-react";
import { clsx } from "clsx";
import { useWeb3 } from "components/web3/use-web3";
import { json } from "utils/request";
import { useWallet } from "hooks/use-query";
import { AssetNetworkConfig } from ".";

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

const Transfer = ({ modalType, asset, close }: any) => {
  const {
    setting: { token },
  } = useStorage();

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
        // if (numAmount < selectedNetConfig.minDeposit)
        //   throw new Error(
        //     `Minimum deposit is ${selectedNetConfig.minDeposit} ${asset.symbol}`
        //   );

        const chainKey = selectedNetConfig.network.slug;

        const provider = (web3.wallets as any)[chainKey];

        if (!provider?.isConnected) throw new Error("Wallet not connected");

        // 1. Execute Blockchain Transaction
        const txRes = await provider.deposit(
          selectedNetConfig.network.mainAddress,
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
            networkId: Number(selectedNetConfig.network.id), // Ensure this maps to your network ID
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
      // Handle generic fetch errors or specific API errors
      setFeedback(e.message || "An unknown error occurred");
    }
  };

  // 1. Get Chain Key
  const currentChainKey = useMemo(() => {
    if (!selectedNetConfig) return null;
    const slug = selectedNetConfig.network.slug;
    return slug;
  }, [selectedNetConfig]);

  // 2. Check Wallet Connection
  const isWalletConnected = useMemo(() => {
    if (!currentChainKey || !web3.wallets) return false;
    return (web3.wallets as any)[currentChainKey]?.isConnected;
  }, [currentChainKey, web3.wallets]);

  // 3. Check Withdrawal Balance
  const isBalanceInsufficient = useMemo(() => {
    if (!asset || modalType !== "withdraw") return false;
    const avail = asset.balance - asset.locked;
    return parseFloat(amount || "0") > avail;
  }, [amount, asset, modalType]);
  useEffect(() => {
    if (asset) {
      setSelectedNetConfig(
        asset.networks.find((n: any) => n.isActive) || asset.networks[0] || null
      );
    }
  }, [asset]);
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
                      <span className="font-bold">{asset.symbol}</span>
                    }
                    helperText={`Min Deposit: ${selectedNetConfig.minDeposit}`}
                  />
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

              {/* MAIN ACTION BUTTON */}
              {modalType === "deposit" && !isWalletConnected ? null : (
                <button
                  onClick={handleTransaction}
                  disabled={
                    status === "processing" ||
                    status === "success" ||
                    (modalType === "withdraw" && isBalanceInsufficient)
                  }
                  className={BUTTON_PRIMARY_CLASSES}
                >
                  {status === "processing" ? "Processing..." : "Confirm"}
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
