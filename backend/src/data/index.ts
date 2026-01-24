import prisma from "../helpers/prisma";
import tokens from "./pure/tokens.json";
import seedData from "./pure/assets.json";
import { PairType } from "@prisma/client";

const xseed = async () => {
  for (let token of tokens) {
    try {
      await prisma.airdropToken.upsert({
        where: { slug: token.slug },
        update: token as any, // Data to update if it exists
        create: token as any, // Data to create if it doesn't exist
      });
    } catch (error) {
      console.error(`Failed to upsert token ${token.slug}:`, error);
    }
  }

  // --- 1. SEED NETWORKS ---
  console.log(`... Syncing ${seedData.networks.length} Networks`);
  const networkMap = new Map<string, number>();

  for (const net of seedData.networks) {
    const record = await prisma.network.upsert({
      where: { slug: net.slug },
      update: {
        name: net.name,
        type: net.type,
        logo: net.logo,
        mainAddress: net.mainAddress,
        isActive: net.isActive,
      },
      create: {
        name: net.name,
        slug: net.slug,
        type: net.type,
        logo: net.logo,
        mainAddress: net.mainAddress,
        isActive: net.isActive,
      },
    });
    networkMap.set(net.slug, record.id);
  }

  // --- 2. SEED ASSETS ---
  console.log(`... Syncing ${seedData.assets.length} Assets`);
  const assetMap = new Map<string, number>(); // Map symbol -> ID

  for (const asset of seedData.assets) {
    const record = await prisma.asset.upsert({
      where: { symbol: asset.symbol },
      update: {
        name: asset.name,
        price: asset.price,
        logo: asset.logo,
        visible: asset.visible,
        active: asset.active,
      },
      create: {
        name: asset.name,
        symbol: asset.symbol,
        price: asset.price,
        logo: asset.logo,
        visible: asset.visible,
        active: asset.active,
      },
    });
    assetMap.set(asset.symbol, record.id);
  }

  // --- 3. SEED ASSET NETWORKS ---
  console.log(`... Syncing ${seedData.assetNetworks.length} AssetNetworks`);

  for (const an of seedData.assetNetworks) {
    const assetId = assetMap.get(an.assetSymbol);
    const networkId = networkMap.get(an.networkSlug);

    if (!assetId || !networkId) {
      console.warn(
        `⚠️ Skipping AssetNetwork: ${an.assetSymbol} on ${an.networkSlug} (Missing ID)`
      );
      continue;
    }

    await prisma.assetNetwork.upsert({
      where: {
        assetId_networkId: {
          assetId: assetId,
          networkId: networkId,
        },
      },
      update: {
        contractAddress: an.contractAddress,
        decimals: an.decimals,
        minDeposit: an.minDeposit,
        minWithdraw: an.minWithdraw,
        withdrawFee: an.withdrawFee,
      },
      create: {
        assetId: assetId,
        networkId: networkId,
        contractAddress: an.contractAddress,
        decimals: an.decimals,
        minDeposit: an.minDeposit,
        minWithdraw: an.minWithdraw,
        withdrawFee: an.withdrawFee,
        canDeposit: true,
        canWithdraw: true,
      },
    });
  }

  // --- 4. SEED TRADING PAIRS ---
  console.log(`... Syncing ${seedData.tradingPairs.length} TradingPairs`);

  for (const pair of seedData.tradingPairs) {
    const baseId = assetMap.get(pair.baseAsset);
    const quoteId = assetMap.get(pair.quoteAsset);

    if (!baseId || !quoteId) {
      console.warn(`⚠️ Skipping Pair: ${pair.symbol} (Missing Asset ID)`);
      continue;
    }

    await prisma.tradingPair.upsert({
      where: {
        symbol_type: { symbol: pair.symbol, type: pair.type as PairType },
      },
      update: {
        externalSymbol: pair.externalSymbol,
        provider: pair.provider as any,
        tickSize: pair.tickSize,
        stepSize: pair.stepSize,
        minQty: pair.minQty,
        pricePrecision: pair.pricePrecision,
        quantityPrecision: pair.quantityPrecision,
        // Use connect for relations
        baseAsset: { connect: { id: baseId } },
        quoteAsset: { connect: { id: quoteId } },
        base: pair.baseAsset,
        quote: pair.quoteAsset,
      },
      create: {
        symbol: pair.symbol,
        externalSymbol: pair.externalSymbol,
        provider: pair.provider as any,
        type: pair.type as any,
        tickSize: pair.tickSize,
        stepSize: pair.stepSize,
        minQty: pair.minQty,
        pricePrecision: pair.pricePrecision,
        quantityPrecision: pair.quantityPrecision,
        // Use connect for relations
        baseAsset: { connect: { id: baseId } },
        quoteAsset: { connect: { id: quoteId } },
        base: pair.baseAsset,
        quote: pair.quoteAsset,
        status: 1,
        active: true,
      },
    });
  }

  console.log("✅ Seed Completed Successfully!");
};

export default xseed;
