import type { ParsedTransactionWithMeta } from "@solana/web3.js";

type ParsedIx = {
  program?: string;
  parsed?: {
    type?: string;
    info?: Record<string, any>;
  };
};

export function toBaseUnits(amount: string, decimals: number): string {
  const cleaned = (amount || "").trim();
  if (!cleaned) return "0";

  // Basic decimal parser (no exponent support). Good enough for user-entered amounts.
  const [wholeRaw, fracRaw = ""] = cleaned.split(".");
  const whole = wholeRaw.replace(/^0+(?=\d)/, "") || "0";
  const frac = fracRaw.replace(/[^0-9]/g, "");

  const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);
  const combined = `${whole}${fracPadded}`.replace(/^0+(?=\d)/, "") || "0";
  return combined;
}

export function findSplTokenTransfer(parsedTx: ParsedTransactionWithMeta | null, opts?: {
  authority?: string;
  source?: string;
  amount?: string; // base units as string
}) {
  if (!parsedTx) return null;

  const instructions = parsedTx.transaction.message.instructions as unknown as ParsedIx[];
  for (const ix of instructions) {
    if (ix?.program !== "spl-token") continue;
    const type = ix?.parsed?.type || "";
    if (!type.toLowerCase().startsWith("transfer")) continue;

    const info = (ix.parsed?.info || {}) as any;

    // `transfer`: { source, destination, authority, amount }
    // `transferChecked`: { source, destination, authority, mint, tokenAmount: { amount, decimals, uiAmountString } }
    const destination: string | undefined = info.destination;
    const source: string | undefined = info.source;
    const authority: string | undefined = info.authority;
    const amount: string | undefined =
      typeof info.amount === "string"
        ? info.amount
        : typeof info?.tokenAmount?.amount === "string"
          ? info.tokenAmount.amount
          : undefined;

    if (!destination) continue;
    if (opts?.authority && authority && authority !== opts.authority) continue;
    if (opts?.source && source && source !== opts.source) continue;
    if (opts?.amount && amount && amount !== opts.amount) continue;

    return { destination, source, authority, amount, type };
  }

  return null;
}
