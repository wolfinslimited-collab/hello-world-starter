import { useState, useEffect } from "react";
import { X, Copy, Check, Loader2, ExternalLink, ArrowRight } from "lucide-react";
import { walletApi } from "services/api";
import QRCode from "react-qr-code";
import { toast } from "react-toastify";

// Local type definitions to avoid import issues
interface Network {
  id: number;
  name: string;
  chain: string;
  logo: string | null;
  main_address: string | null;
  explorer_url: string | null;
  is_active: boolean;
}

interface AssetNetwork {
  id: number;
  asset_id: number;
  network_id: number;
  contract_address: string | null;
  decimals: number;
  min_deposit: number;
  min_withdraw: number;
  withdraw_fee: number;
  can_deposit: boolean;
  can_withdraw: boolean;
  is_active: boolean;
  network?: Network;
}

interface Asset {
  id: number;
  name: string;
  symbol: string;
  price: number;
  logo: string | null;
  active: boolean;
  visible: boolean;
  networks?: AssetNetwork[];
}

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
  onDepositSuccess?: () => void;
}

export default function DepositModal({ isOpen, onClose, assets, onDepositSuccess }: DepositModalProps) {
  const [step, setStep] = useState<"select" | "address" | "verify">("select");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<AssetNetwork | null>(null);
  const [depositAddress, setDepositAddress] = useState<string>("");
  const [minDeposit, setMinDeposit] = useState<number>(0);
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [txSignature, setTxSignature] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setStep("select");
      setSelectedAsset(null);
      setSelectedNetwork(null);
      setDepositAddress("");
      setTxSignature("");
    }
  }, [isOpen]);

  const handleAssetSelect = (asset: Asset) => {
    setSelectedAsset(asset);
    setSelectedNetwork(null);
  };

  const handleNetworkSelect = async (network: AssetNetwork) => {
    if (!selectedAsset) return;
    
    setSelectedNetwork(network);
    setLoading(true);
    
    try {
      const result = await walletApi.getDepositAddress(selectedAsset.id, network.network_id);
      setDepositAddress(result.address);
      setMinDeposit(result.minDeposit);
      setContractAddress(result.contractAddress);
      setStep("address");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to get deposit address";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleVerifyDeposit = async () => {
    if (!txSignature.trim()) {
      toast.error("Please enter the transaction signature");
      return;
    }

    setVerifying(true);
    try {
      const result = await walletApi.verifyDeposit({
        txSignature: txSignature.trim(),
        networkId: selectedNetwork?.network_id,
        assetId: selectedAsset?.id,
      });

      if (result.status === "completed") {
        toast.success(`Deposit confirmed: ${result.amount} ${result.assetSymbol}`);
        onDepositSuccess?.();
        onClose();
      } else if (result.status === "already_processed") {
        toast.info("This transaction has already been processed");
      } else if (result.status === "below_minimum") {
        toast.warning("Deposit amount is below minimum requirement");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to verify deposit";
      toast.error(errorMessage);
    } finally {
      setVerifying(false);
    }
  };

  if (!isOpen) return null;

  // Filter assets that have deposit-enabled networks
  const depositableAssets = assets.filter((asset: Asset) => 
    asset.networks?.some((n: AssetNetwork) => n.can_deposit && n.is_active)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-white/5 rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white">
            {step === "select" && "Deposit"}
            {step === "address" && `Deposit ${selectedAsset?.symbol}`}
            {step === "verify" && "Verify Deposit"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Step 1: Select Asset & Network */}
          {step === "select" && (
            <div className="space-y-4">
              {!selectedAsset ? (
                <>
                  <p className="text-sm text-neutral-400">Select asset to deposit</p>
                  <div className="space-y-2">
                    {depositableAssets.map((asset: Asset) => (
                      <button
                        key={asset.id}
                        onClick={() => handleAssetSelect(asset)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-neutral-800/50 hover:bg-neutral-800 border border-white/5 transition-all"
                      >
                        {asset.logo && (
                          <img src={asset.logo} alt={asset.symbol} className="w-8 h-8 rounded-full" />
                        )}
                        <div className="text-left">
                          <div className="font-medium text-white">{asset.symbol}</div>
                          <div className="text-xs text-neutral-400">{asset.name}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 ml-auto text-neutral-500" />
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setSelectedAsset(null)}
                    className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    ← Back to assets
                  </button>
                  <p className="text-sm text-neutral-400">Select network for {selectedAsset.symbol}</p>
                  <div className="space-y-2">
                    {selectedAsset.networks
                      ?.filter((n: AssetNetwork) => n.can_deposit && n.is_active)
                      .map((network: AssetNetwork) => (
                        <button
                          key={network.id}
                          onClick={() => handleNetworkSelect(network)}
                          disabled={loading}
                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-neutral-800/50 hover:bg-neutral-800 border border-white/5 transition-all disabled:opacity-50"
                        >
                          {network.network?.logo && (
                            <img src={network.network.logo} alt={network.network.name} className="w-8 h-8 rounded-full" />
                          )}
                          <div className="text-left">
                            <div className="font-medium text-white">{network.network?.name}</div>
                            <div className="text-xs text-neutral-400">
                              Min: {network.min_deposit} {selectedAsset.symbol}
                            </div>
                          </div>
                          {loading && selectedNetwork?.id === network.id ? (
                            <Loader2 className="w-4 h-4 ml-auto animate-spin text-emerald-400" />
                          ) : (
                            <ArrowRight className="w-4 h-4 ml-auto text-neutral-500" />
                          )}
                        </button>
                      ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 2: Show Deposit Address */}
          {step === "address" && selectedAsset && selectedNetwork && (
            <div className="space-y-4">
              <button
                onClick={() => setStep("select")}
                className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                ← Change asset/network
              </button>

              <div className="bg-neutral-800/50 rounded-xl p-4 border border-white/5">
                <div className="flex items-center gap-2 mb-3">
                  {selectedAsset.logo && (
                    <img src={selectedAsset.logo} alt={selectedAsset.symbol} className="w-6 h-6 rounded-full" />
                  )}
                  <span className="font-medium text-white">{selectedAsset.symbol}</span>
                  <span className="text-neutral-400">on</span>
                  <span className="text-white">{selectedNetwork.network?.name}</span>
                </div>

                {/* QR Code */}
                <div className="bg-white p-4 rounded-xl mb-4 mx-auto w-fit">
                  <QRCode value={depositAddress} size={160} />
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <label className="text-xs text-neutral-400">Deposit Address</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={depositAddress}
                      className="flex-1 bg-neutral-900 border border-white/5 rounded-lg px-3 py-2 text-sm text-white font-mono"
                    />
                    <button
                      onClick={() => copyToClipboard(depositAddress)}
                      className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-white/5 transition-colors"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-neutral-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Contract Address (for tokens) */}
                {contractAddress && (
                  <div className="mt-3 space-y-2">
                    <label className="text-xs text-neutral-400">Token Contract</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={contractAddress}
                        className="flex-1 bg-neutral-900 border border-white/5 rounded-lg px-3 py-2 text-xs text-neutral-300 font-mono"
                      />
                      <button
                        onClick={() => copyToClipboard(contractAddress)}
                        className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-white/5 transition-colors"
                      >
                        <Copy className="w-4 h-4 text-neutral-400" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Minimum Deposit */}
                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <p className="text-xs text-amber-400">
                    ⚠️ Minimum deposit: <strong>{minDeposit} {selectedAsset.symbol}</strong>
                  </p>
                </div>
              </div>

              {/* Manual Verify Button */}
              <button
                onClick={() => setStep("verify")}
                className="w-full py-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors font-medium"
              >
                I've sent the funds — Verify
              </button>

              <p className="text-xs text-center text-neutral-500">
                Deposits are detected automatically. Use verify button if deposit isn't credited after 5 minutes.
              </p>
            </div>
          )}

          {/* Step 3: Verify Transaction */}
          {step === "verify" && (
            <div className="space-y-4">
              <button
                onClick={() => setStep("address")}
                className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                ← Back
              </button>

              <div className="space-y-2">
                <label className="text-sm text-neutral-400">Transaction Signature</label>
                <input
                  type="text"
                  value={txSignature}
                  onChange={(e) => setTxSignature(e.target.value)}
                  placeholder="Paste your transaction signature..."
                  className="w-full bg-neutral-800 border border-white/5 rounded-xl px-4 py-3 text-white placeholder-neutral-500 font-mono text-sm"
                />
                <p className="text-xs text-neutral-500">
                  Find this in your wallet transaction history or on{" "}
                  <a
                    href="https://solscan.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:underline inline-flex items-center gap-1"
                  >
                    Solscan <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>

              <button
                onClick={handleVerifyDeposit}
                disabled={verifying || !txSignature.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:from-emerald-600 hover:to-teal-700"
              >
                {verifying ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  "Verify Deposit"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}