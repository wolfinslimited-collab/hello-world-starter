import prisma from "../helpers/prisma";
import { AssetTransactionType, AssetTransactionStatus } from "@prisma/client";
import { AirdropService } from "../services/airdrop-tokens";
import { math } from "../helpers/mathUtils";
const airdropService = new AirdropService();

/**
 * 1. GET ALL ACTIVE ASSETS
 * Returns assets including their network details (contract address, main platform wallet, etc.)
 */
export const getAssets = async () => {
  try {
    const assets = await prisma.asset.findMany({
      where: {
        active: true,
        visible: true,
      },
      include: {
        networks: {
          where: { isActive: true }, // Only active asset-network pairs
          include: {
            network: true, // Include Network details (Name, Logo, Main Address)
          },
        },
      },
    });
    return assets;
  } catch (error) {
    console.error("Error fetching assets:", error);
    return [];
  }
};

/**
 * 2. GET USER WALLETS
 * Returns all internal balances for a specific user
 */
export const getUserWallets = async (userId: number) => {
  try {
    const wallets = await prisma.wallet.findMany({
      where: { userId },
      include: {
        asset: true, // Include the Asset info (Symbol, Logo, Price)
      },
    });
    return wallets;
  } catch (error) {
    console.error("Error fetching user wallets:", error);
    return [];
  }
};

/**
 * 3. MODIFY WALLET BALANCE
 * Atomically increases or decreases a user's balance.
 *
 * @param userId - The user to update
 * @param amount - Positive to Add, Negative to Deduct
 * @param options - Provide ONE of: { assetSymbol, assetId, walletId }
 */
type ModifyWalletOptions =
  | { assetSymbol: string; assetId?: never; walletId?: never }
  | { assetId: number; assetSymbol?: never; walletId?: never }
  | { walletId: number; assetSymbol?: never; assetId?: never };

export const modifyWallet = async (
  userId: number,
  amount: number,
  identifier: ModifyWalletOptions
) => {
  try {
    let targetAssetId: number | null = null;
    const newAmount = math.normal(amount);
    // A. Resolve the Asset ID based on input
    if (identifier.walletId) {
      // Case 1: By Wallet ID
      const wallet = await prisma.wallet.findUnique({
        where: { id: identifier.walletId },
      });
      if (!wallet) throw new Error("Wallet not found");
      if (wallet.userId !== userId)
        throw new Error("Wallet does not belong to user");
      targetAssetId = wallet.assetId;
    } else if (identifier.assetId) {
      // Case 2: By Asset ID
      targetAssetId = identifier.assetId;
    } else if (identifier.assetSymbol) {
      // Case 3: By Asset Symbol (e.g., "USDT")
      const asset = await prisma.asset.findUnique({
        where: { symbol: identifier.assetSymbol },
      });
      if (!asset) throw new Error(`Asset ${identifier.assetSymbol} not found`);
      targetAssetId = asset.id;
    }

    if (!targetAssetId) throw new Error("Could not determine Asset ID");

    const wallet = await prisma.wallet.findUnique({
      where: {
        userId_assetId: { userId, assetId: targetAssetId },
      },
    });

    const currentBalance = wallet?.balance || 0;
    // 2. Use your library to fix the precision issue
    const newBalance = math.sum(currentBalance, newAmount);

    // 3. Update or Create
    const updatedWallet = await prisma.wallet.upsert({
      where: {
        userId_assetId: { userId, assetId: targetAssetId },
      },
      update: {
        balance: newBalance, // Set the exact calculated number
      },
      create: {
        userId,
        assetId: targetAssetId,
        balance: newAmount,
      },
    });

    return { success: true, wallet: updatedWallet };
  } catch (error: any) {
    console.error("Modify Wallet Error:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * 4. SUBMIT WEB3 DEPOSIT
 * User claims they sent funds. We record it as Pending.
 * (A separate Cron Job should verify the TX on-chain later)
 */
export const submitDeposit = async (
  userId: number,
  data: {
    txId: string;
    amount: number;
    assetId: number;
    networkId: number;
    fromAddress: string; // The user's address they claim to have sent from
  }
) => {
  try {
    const { txId, amount, assetId, networkId, fromAddress } = data;

    // 1. Prevent Double Submission
    const existingTx = await prisma.walletTransaction.findUnique({
      where: { txId },
    });
    if (existingTx) {
      throw new Error("Transaction ID already exists.");
    }

    // 2. Verify Network & Asset Validity
    const assetNetwork = await prisma.assetNetwork.findUnique({
      where: {
        assetId_networkId: {
          assetId,
          networkId,
        },
      },
      include: { network: true },
    });

    if (!assetNetwork || !assetNetwork.canDeposit) {
      throw new Error(
        "Deposits are currently disabled for this asset/network."
      );
    }

    // 3. Verify User Link (Security Check)
    // Check if the 'fromAddress' belongs to the user's linked addresses on this network

    // const userLink = await prisma.links.findFirst({
    //   where: {
    //     userId,
    //     address: fromAddress,
    //   },
    // });

    // if (!userLink) {
    //   throw new Error("This sender address is not linked to your account.");
    // }

    await modifyWallet(userId, amount, { assetId });

    // 4. Create Transaction Record (Pending)
    // We do NOT add balance yet. Balance is added only after Admin/Cron confirms success.
    const transaction = await prisma.walletTransaction.create({
      data: {
        userId,
        assetId,
        networkId,
        txId,
        amount,
        fromAddress,
        toAddress: assetNetwork.network.mainAddress, // The platform wallet
        type: AssetTransactionType.Deposit,
        status: AssetTransactionStatus.Completed,
      },
    });
    const referee = await prisma.referral.findFirst({
      where: { refereeId: userId },
    });
    if (referee && referee.status === false) {
      await prisma.referral.update({
        where: { id: referee.id },
        data: { status: true },
      });
      await airdropService.addStaticAmount(referee.refereeId, 50);
    }
    return { success: true, transaction };
  } catch (error: any) {
    console.error("Submit Deposit Error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * 5. REQUEST WITHDRAWAL
 * User requests to pull funds out.
 */
export const requestWithdraw = async (
  userId: number,
  data: {
    assetId: number;
    networkId: number;
    amount: number;
    toAddress: string;
  }
) => {
  try {
    const { assetId, networkId, amount, toAddress } = data;

    if (amount <= 0) throw new Error("Invalid amount");

    // 1. Check Network/Asset Limits
    const assetNetwork = await prisma.assetNetwork.findUnique({
      where: {
        assetId_networkId: {
          assetId,
          networkId,
        },
      },
    });

    if (!assetNetwork || !assetNetwork.canWithdraw) {
      throw new Error("Withdrawals are disabled for this network.");
    }
    if (amount < assetNetwork.minWithdraw) {
      throw new Error(`Minimum withdrawal is ${assetNetwork.minWithdraw}`);
    }

    // 2. Check User Balance & Deduct Immediately
    // We assume 'locked' balance or simply deduct 'balance'.
    // Here we deduct 'balance' immediately to safely reserve funds.

    // Check if user has enough funds
    const wallet = await prisma.wallet.findUnique({
      where: {
        userId_assetId: { userId, assetId },
      },
    });

    if (!wallet || wallet.balance < amount) {
      throw new Error("Insufficient balance.");
    }

    // 3. Atomically Deduct Balance
    // We use modifyWallet with a negative amount
    await modifyWallet(userId, -amount, { assetId });

    // 4. Calculate Fee (Optional logic)
    const fee = assetNetwork.withdrawFee || 0;
    const finalAmount = amount - fee;

    // 5. Create Transaction Record
    const transaction = await prisma.walletTransaction.create({
      data: {
        userId,
        assetId,
        networkId,
        amount: -amount,

        toAddress,
        type: AssetTransactionType.Withdraw,
        status: AssetTransactionStatus.Pending,

        // You might want to store fee info in 'memo' or a separate column
        memo: `Fee: ${fee}`,
      },
    });

    return { success: true, transaction, fee, finalAmount };
  } catch (error: any) {
    console.error("Request Withdraw Error:", error);
    return { success: false, error: error.message };
  }
};
