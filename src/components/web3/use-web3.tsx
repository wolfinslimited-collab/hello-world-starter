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
import { findSplTokenTransfer, toBaseUnits } from "./solana/splTransfer";

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
      let broadcastSignature: string | null = null;

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

          // ===== CRITICAL DEBUG LOGGING =====
          console.log("=".repeat(60));
          console.log("[SOLANA SPL DEPOSIT] Transaction Details:");
          console.log("=".repeat(60));
          console.log("Token Mint:", tokenAddress);
          console.log("User Wallet (signer):", pubKey.toBase58());
          console.log("User's Token Account (SOURCE - fromToken):", fromToken.toBase58());
          console.log("Recipient Address (provided by backend):", recipient);
          console.log("Decimals:", tokenDecimals);
          console.log("Amount:", amount);
          console.log("-".repeat(60));

          // STRICT VALIDATION: The recipient MUST be a token account owned by TOKEN_PROGRAM_ID
          // This prevents sending to system wallets where ATAs would be auto-derived
          const recipientInfo = await connection.getAccountInfo(recipientKey);
          
          console.log("Recipient Account Info:");
          console.log("  - Exists:", !!recipientInfo);
          console.log("  - Owner:", recipientInfo?.owner?.toBase58() || "N/A");
          console.log("  - Is Token Account:", recipientInfo?.owner?.equals(TOKEN_PROGRAM_ID) || false);
          
          if (!recipientInfo) {
            console.error("[SOLANA SPL DEPOSIT] ABORT: Recipient not found on-chain!");
            throw new Error(
              "Invalid Solana deposit address (not found on-chain). Please refresh the deposit address."
            );
          }
          if (!recipientInfo.owner.equals(TOKEN_PROGRAM_ID)) {
            console.error("[SOLANA SPL DEPOSIT] ABORT: Recipient is NOT a token account!");
            console.error("  Expected owner:", TOKEN_PROGRAM_ID.toBase58());
            console.error("  Actual owner:", recipientInfo.owner.toBase58());
            throw new Error(
              "Invalid Solana deposit address (expected SPL token account). Please refresh the deposit address."
            );
          }

          // Use the recipient directly - no ATA derivation for the destination!
          const toToken: PublicKey = recipientKey;
          actualRecipient = toToken.toBase58();

          console.log("-".repeat(60));
          console.log("FINAL DESTINATION (toToken):", actualRecipient);
          console.log("Verify: toToken === recipient:", actualRecipient === recipient);
          console.log("=".repeat(60));

          // Calculate amount with proper decimals (e.g., USDT/USDC = 6 decimals)
          // Use string-based parsing to avoid floating point precision issues.
          const rawAmountStr = toBaseUnits(amount, tokenDecimals);
          const tokenAmount = BigInt(rawAmountStr);

          console.log("Creating transfer instruction:");
          console.log("  - FROM:", fromToken.toBase58());
          console.log("  - TO:", toToken.toBase58());
          console.log("  - AUTHORITY:", pubKey.toBase58());
          console.log("  - AMOUNT (raw):", rawAmountStr);

          tx.add(
            createTransferInstruction(
              fromToken,  // SOURCE: User's token account
              toToken,    // DESTINATION: AsterDEX vault (must be token account!)
              pubKey,     // AUTHORITY: User's wallet
              tokenAmount
            )
          );

          console.log("Transfer instruction added to transaction.");
        } else {
          // Native SOL Transfer
          console.log("[SOLANA NATIVE] Sending SOL to:", recipient);
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

        console.log("[SOLANA] Signing transaction...");
        const signedTx = await signSolTx(tx);
        
        console.log("[SOLANA] Broadcasting transaction...");
        broadcastSignature = await connection.sendRawTransaction(
          signedTx.serialize(),
          {
            maxRetries: 3,
          }
        );

        console.log("[SOLANA] Transaction broadcasted! Signature:", broadcastSignature);
        console.log("[SOLANA] Waiting for confirmation...");

        // --- WAIT FOR CONFIRMATION (HTTP polling, no websockets) ---
        await waitForSolanaConfirmation({
          connection,
          signature: broadcastSignature,
          lastValidBlockHeight,
          commitment: "confirmed",
        });

        // --- POST-TX SAFETY VERIFICATION ---
        // Read back the confirmed transaction and verify the token transfer destination.
        // If it doesn't match the expected vault, we do NOT mark this deposit as successful.
        let onChainToAddress: string | null = null;
        try {
          if (tokenAddress) {
            const mintKey = new PublicKey(tokenAddress);
            const fromToken = await getAssociatedTokenAddress(mintKey, pubKey);
            const rawAmountStr = toBaseUnits(amount, tokenDecimals);

            for (let attempt = 0; attempt < 8; attempt++) {
              const parsedTx = await connection.getParsedTransaction(broadcastSignature, {
                commitment: "confirmed",
                maxSupportedTransactionVersion: 0,
              });

              const found = findSplTokenTransfer(parsedTx, {
                authority: pubKey.toBase58(),
                source: fromToken.toBase58(),
                amount: rawAmountStr,
              });

              if (found?.destination) {
                onChainToAddress = found.destination;
                break;
              }

              await sleep(1500);
            }

            if (onChainToAddress && onChainToAddress !== actualRecipient) {
              throw new Error(
                `[SAFETY CHECK] On-chain destination mismatch. Expected ${actualRecipient} but transaction sent to ${onChainToAddress}.`
              );
            }
          }
        } catch (verifyErr: any) {
          // Mismatch is critical; other failures are non-fatal (RPC sometimes can't return parsed tx quickly).
          if (String(verifyErr?.message || "").includes("[SAFETY CHECK]")) {
            throw verifyErr;
          }
          console.warn(
            "[SOLANA] Post-tx destination verification skipped:",
            verifyErr?.message || verifyErr
          );
        }

        console.log("[SOLANA] Transaction CONFIRMED!");
        console.log("=".repeat(60));
        console.log("FINAL SUMMARY:");
        console.log("  Signature:", broadcastSignature);
        console.log("  Sent TO:", actualRecipient);
        if (onChainToAddress) {
          console.log("  Verified TO (from chain):", onChainToAddress);
        }
        console.log("  View on Solscan: https://solscan.io/tx/" + broadcastSignature);
        console.log("=".repeat(60));

        return {
          success: true,
          hash: broadcastSignature,
          // Prefer the destination read back from chain if available.
          toAddress: onChainToAddress || actualRecipient,
          expectedToAddress: actualRecipient,
          onChainToAddress,
        };
      } catch (e: any) {
        console.error("[SOLANA] Deposit error:", e);
        return {
          success: false,
          error: e.message,
          // if we already broadcasted, bubble up signature so UI can show it
          hash: broadcastSignature || undefined,
        };
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
