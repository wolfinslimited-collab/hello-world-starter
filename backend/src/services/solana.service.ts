import { Connection, PublicKey } from "@solana/web3.js";

const solanaAddress: string = process.env.XDROP_SOLANA_WALLET || "";
const API_KEY = "1d8bcf2e-46fe-4fe1-9bff-a5233450b45f";
const connection = new Connection(
  `https://mainnet.helius-rpc.com/?api-key=${API_KEY}`,
  "confirmed"
);

export async function checkTxStatus(
  txId: string
): Promise<
  "confirmed" | "confirmed_but_wrong_recipient" | "failed" | "not_found"
> {
  try {
    const statusResp = await connection.getSignatureStatus(txId);
    const status = statusResp.value;

    if (!status) {
      return "not_found";
    }

    if (status.err) {
      return "failed";
    }

    // Transaction is confirmed, now get the full details to check the recipient
    const txDetails = await connection.getParsedTransaction(txId, {
      maxSupportedTransactionVersion: 0,
    });

    if (!txDetails) {
      // This case is unlikely if getSignatureStatus returned a confirmed status,
      // but it's good practice to handle it.
      return "not_found";
    }
    // Parse the transaction instructions to find the transfer details
    const instructions = txDetails.transaction.message.instructions;

    for (const instruction of instructions) {
      // Check for a system program transfer
      if (
        "parsed" in instruction &&
        instruction.programId.equals(
          new PublicKey("11111111111111111111111111111111")
        ) && // System Program ID
        instruction.parsed.type === "transfer"
      ) {
        const transferInfo = instruction.parsed.info;
        if (transferInfo.destination === solanaAddress) {
          return "confirmed";
        }
      }
    }

    // If we've looped through all instructions and didn't find a matching recipient
    return "confirmed_but_wrong_recipient";
  } catch (error) {
    console.error("❌ Error checking tx status:", error);
    return "not_found";
  }
}
