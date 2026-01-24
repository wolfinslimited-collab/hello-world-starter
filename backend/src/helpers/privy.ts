import { PrivyClient } from "@privy-io/server-auth";

export const privy = new PrivyClient(
  process.env.PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
);

export const CHAINS = {
  // EVM
  ethereum: "ethereum",
  base: "ethereum", // Base is an EVM chain, so we use 'ethereum' wallet type
  arbitrum: "ethereum", // Arbitrum is EVM
  polygon: "ethereum", // Polygon is EVM

  // Non-EVM
  solana: "solana",
  bitcoin: "bitcoin-segwit", // Privy uses 'bitcoin-segwit' for native BTC
  spark: "spark", // Bitcoin L2
  sui: "sui",
  aptos: "aptos",
  tron: "tron",
  stellar: "stellar",
  cosmos: "cosmos",
  near: "near",
  ton: "ton",
};
