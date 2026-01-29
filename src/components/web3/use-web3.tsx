/* eslint-disable no-extra-boolean-cast */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  useAccount,
  useWriteContract,
  useDisconnect,
  useSignMessage,
  useSendTransaction,
  usePublicClient, // Needed to wait for EVM receipts
} from "wagmi";
import { parseUnits, parseEther } from "viem";
import {
  useConnection,
  useWallet as useSolWallet,
} from "@solana/wallet-adapter-react";
import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { useWallet as useTronWallet } from "@tronweb3/tronwallet-adapter-react-hooks";
import { Buffer } from "buffer";

// Simple ERC20 ABI
const ERC20_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

// Helper to shorten addresses
const shortenAddress = (address: string | null | undefined) => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// --- TRON HELPER: Poll for confirmation ---
const waitForTronConfirmation = async (
  tronWeb: any,
  txId: string,
  maxAttempts = 30 // 30 attempts * 2 seconds = 60 seconds (Wait longer if needed)
): Promise<boolean> => {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      // getTransactionInfo returns execution results (Energy usage, Success/Fail)
      const info = await tronWeb.trx.getTransactionInfo(txId);

      // If info exists and has a block number, it's included in a block
      if (info && info.id) {
        // 1. Check for Smart Contract Result (for TRC20)
        if (info.receipt) {
          if (info.receipt.result === "SUCCESS") {
            return true;
          } else if (info.receipt.result === "OUT_OF_ENERGY") {
            throw new Error("Transaction failed: Out of Energy");
          } else if (info.receipt.result) {
            throw new Error(`Transaction failed: ${info.receipt.result}`);
          }
        }

        // 2. Check for Native TRX Transfer result
        // For native transfers, usually, if 'contractResult' is empty or checks out
        if (info.contractResult && info.contractResult[0]) {
          // If contractResult is present (even for native), empty string often means success in some versions,
          // but usually strictly checking receipt.result is safer for TRC20.
          // For Native, if we are here without a revert, it's likely good.
          return true;
        }

        // Fallback: If we have an ID and blockNumber but no specific failure tag
        if (info.blockNumber) return true;
      }
    } catch (e: any) {
      if (e.message.includes("Transaction failed")) throw e;
      // If error is just "not found yet", ignore and keep polling
    }
    // Wait 2 seconds before next poll
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error("Transaction confirmation timed out (Tron)");
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// NOTE: We intentionally avoid `connection.confirmTransaction()` here because it relies on
// websocket `signatureSubscribe`, which can be broken/malformed on some RPC providers.
// Instead we poll `getSignatureStatuses` (HTTP) until confirmed/finalized.
const waitForSolanaConfirmation = async (params: {
  connection: any;
  signature: string;
  lastValidBlockHeight: number;
  commitment?: "processed" | "confirmed" | "finalized";
  timeoutMs?: number;
}) => {
  const {
    connection,
    signature,
    lastValidBlockHeight,
    commitment = "confirmed",
    timeoutMs = 120_000,
  } = params;

  const startedAt = Date.now();

  while (true) {
    const elapsed = Date.now() - startedAt;
    if (elapsed > timeoutMs) {
      throw new Error("Transaction confirmation timed out (Solana)");
    }

    // 1) Check signature status (HTTP RPC)
    const { value } = await connection.getSignatureStatuses([signature], {
      searchTransactionHistory: true,
    });

    const status = value?.[0];
    if (status?.err) {
      throw new Error("Transaction failed on chain (Solana)");
    }

    if (
      status?.confirmationStatus === "confirmed" ||
      status?.confirmationStatus === "finalized"
    ) {
      return;
    }

    // 2) Ensure we don't wait past the blockhash validity
    const currentHeight = await connection.getBlockHeight(commitment);
    if (currentHeight > lastValidBlockHeight) {
      throw new Error(`Signature ${signature} has expired: block height exceeded.`);
    }

    await sleep(2000);
  }
};

export const useWeb3 = () => {
  // 1. EVM Hooks
  const {
    address: evmAddress,
    isConnected: isEvmConnected,
    chain,
  } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();
  const { disconnect: discEvm } = useDisconnect();
  const { signMessageAsync: signEvm } = useSignMessage();
  const publicClient = usePublicClient(); // Used to check tx status

  // 2. Solana Hooks
  const { connection } = useConnection();
  const {
    publicKey: solAddress,
    signTransaction: signSolTx,
    signMessage: signSol,
    disconnect: discSol,
  } = useSolWallet();

  // 3. Tron Hooks
  const {
    address: tronAddress,
    connected: isTronConnected,
    signMessage: signTron,
    disconnect: discTron,
  } = useTronWallet();

  // --- DETERMINE ACTIVE CHAIN ---
  const getActiveChain = () => {
    if (isTronConnected) return "TRON";
    if (!!solAddress) return "SOLANA";
    if (isEvmConnected && chain) {
      if (chain.id === 1) return "ETH";
      if (chain.id === 56) return "BSC";
      return "EVM_OTHER";
    }
    return "NONE";
  };

  const activeChain = getActiveChain();
  const isConnected = activeChain !== "NONE";

  // --- WALLET ACTION CREATORS ---

  // -> EVM Actions (Shared Logic for Eth/Bsc)
  const createEvmActions = () => ({
    signLoginMessage: async (message: string = "Login") => {
      try {
        const sig = await signEvm({ message });
        return { success: true, signature: sig, address: evmAddress };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
    deposit: async (
      recipient: string,
      amount: string,
      tokenAddress: string = "",
      tokenDecimals: number = 18
    ) => {
      try {
        if (!publicClient) throw new Error("Network not ready");

        let hash: `0x${string}`;

        if (tokenAddress) {
          // ERC20
          hash = await writeContractAsync({
            address: tokenAddress as `0x${string}`,
            abi: ERC20_ABI,
            functionName: "transfer",
            args: [
              recipient as `0x${string}`,
              parseUnits(amount, tokenDecimals),
            ],
          });
        } else {
          // Native ETH/BNB
          hash = await sendTransactionAsync({
            to: recipient as `0x${string}`,
            value: parseEther(amount),
          });
        }

        // --- WAIT FOR CONFIRMATION ---
        // This ensures the transaction wasn't just sent, but mined and successful
        const receipt = await publicClient.waitForTransactionReceipt({
          hash,
          confirmations: 1, // Wait for at least 1 block
        });

        if (receipt.status === "success") {
          return { success: true, hash };
        } else {
          return { success: false, error: "Transaction Reverted on Chain" };
        }
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
    disconnect: async () => {
      discEvm();
    },
  });

  // -> Solana Actions
  const solanaActions = {
    signLoginMessage: async (message: string = "Login") => {
      try {
        if (!solAddress || !signSol) throw new Error("Wallet not ready");
        const encodedMessage = new TextEncoder().encode(message);
        const sigBytes = await signSol(encodedMessage);
        const sig = Buffer.from(sigBytes).toString("base64");
        return {
          success: true,
          signature: sig,
          address: solAddress.toBase58(),
        };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
    deposit: async (
      recipient: string,
      amount: string,
      tokenAddress: string = "",
      tokenDecimals: number = 9 // Default to SOL decimals
    ) => {
      try {
        if (!solAddress || !signSolTx) throw new Error("Wallet not ready");
        const pubKey = solAddress;
        const recipientKey = new PublicKey(recipient);

        let actualRecipient: string = recipient;

        const tx = new Transaction();

        if (tokenAddress) {
          // SPL Token Transfer
          const mintKey = new PublicKey(tokenAddress);
          const fromToken = await getAssociatedTokenAddress(mintKey, pubKey);

          // IMPORTANT:
          // For deposits, the backend must provide a *token vault* (token account) for SPL transfers.
          // Deriving an ATA for a system wallet can route funds to a different address than shown.
          const recipientInfo = await connection.getAccountInfo(recipientKey);
          if (!recipientInfo) {
            throw new Error(
              "Invalid Solana deposit address (not found on-chain). Please refresh the deposit address."
            );
          }
          if (!recipientInfo.owner.equals(TOKEN_PROGRAM_ID)) {
            throw new Error(
              "Invalid Solana deposit address (expected SPL token account). Please refresh the deposit address."
            );
          }

          const toToken: PublicKey = recipientKey;
          actualRecipient = toToken.toBase58();

          // Calculate amount with proper decimals (e.g., USDT/USDC = 6 decimals)
          const tokenAmount = Math.floor(parseFloat(amount) * Math.pow(10, tokenDecimals));

          tx.add(
            createTransferInstruction(
              fromToken,
              toToken,
              pubKey,
              tokenAmount
            )
          );
        } else {
          // Native SOL Transfer
          tx.add(
            SystemProgram.transfer({
              fromPubkey: pubKey,
              toPubkey: recipientKey,
              lamports: Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL),
            })
          );
        }

        // Get fresh blockhash for confirmation strategy
        const { blockhash, lastValidBlockHeight } =
          await connection.getLatestBlockhash();

        tx.recentBlockhash = blockhash;
        tx.feePayer = pubKey;

        const signedTx = await signSolTx(tx);
        const signature = await connection.sendRawTransaction(
          signedTx.serialize(),
          {
            maxRetries: 3,
          }
        );

        // --- WAIT FOR CONFIRMATION (HTTP polling, no websockets) ---
        await waitForSolanaConfirmation({
          connection,
          signature,
          lastValidBlockHeight,
          commitment: "confirmed",
        });

        return { success: true, hash: signature, toAddress: actualRecipient };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
    disconnect: async () => {
      discSol();
    },
  };

  // -> Tron Actions
  const tronActions = {
    signLoginMessage: async (message: string = "Login") => {
      try {
        if (!signTron) throw new Error("Wallet not ready");
        const sig = await signTron(message);
        return { success: true, signature: sig, address: tronAddress };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
    deposit: async (
      recipient: string,
      amount: string,
      tokenAddress: string = ""
    ) => {
      try {
        const tronWeb = (window as any).tronWeb;
        if (!tronWeb || !tronWeb.ready) throw new Error("TronWeb not ready");

        let txId = "";

        if (tokenAddress) {
          // --- TRC20 TRANSFER ---
          // Using triggerSmartContract is often more reliable for getting ID immediately than contract().send()
          // But contract().at().transfer().send() is standard for adapters.
          const contract = await tronWeb.contract().at(tokenAddress);

          // .send() usually returns the Transaction ID string directly
          txId = await contract
            .transfer(recipient, parseInt(amount) * 1_000_000)
            .send();
        } else {
          // --- TRX TRANSFER ---
          const sunAmount = tronWeb.toSun(amount);
          const tx = await tronWeb.trx.sendTransaction(recipient, sunAmount);
          // sendTransaction returns a signed transaction object
          txId = tx?.txid || tx?.transaction?.txID;
        }

        if (!txId) throw new Error("Failed to broadcast transaction");

        // --- STRICT CONFIRMATION LOOP ---
        // We wait here to ensure it didn't burn energy and fail.
        await waitForTronConfirmation(tronWeb, txId);

        // If waitForTronConfirmation didn't throw, we are good.
        return { success: true, hash: txId };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    },
    disconnect: async () => {
      discTron();
    },
  };

  const isEthActive = isEvmConnected && chain?.id === 1;
  const isBscActive = isEvmConnected && chain?.id === 56;
  const evmActions = createEvmActions();

  return {
    isConnected,
    activeChain,
    wallets: {
      eth: {
        address: isEthActive ? evmAddress : null,
        addressShort: isEthActive ? shortenAddress(evmAddress) : "",
        isConnected: isEthActive,
        ...evmActions,
      },
      bsc: {
        address: isBscActive ? evmAddress : null,
        addressShort: isBscActive ? shortenAddress(evmAddress) : "",
        isConnected: isBscActive,
        ...evmActions,
      },
      solana: {
        address: solAddress ? solAddress.toBase58() : null,
        addressShort: solAddress ? shortenAddress(solAddress.toBase58()) : "",
        isConnected: !!solAddress,
        ...solanaActions,
      },
      tron: {
        address: tronAddress || null,
        addressShort: tronAddress ? shortenAddress(tronAddress) : "",
        isConnected: isTronConnected,
        ...tronActions,
      },
    },
  };
};
