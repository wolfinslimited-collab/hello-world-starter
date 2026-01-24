import { AssetTransactionType, AssetTransactionStatus } from "@prisma/client";
import prisma from "../helpers/prisma";

export class AdminService {
  /**
   * 1. GET USER LIST (Paginated)
   * Includes social links and quick activity counts for status badges.
   */
  async getUserList(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        include: {
          links: true,
          _count: {
            select: {
              WalletTransactions: true,
              transactions: true,
              referrals: true,
              userTokens: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count(),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 2. GET COMPREHENSIVE USER PROFILE
   * Fetches every related entity for a deep-dive admin view.
   */
  async getUserFullDetails(userId: number) {
    return await prisma.user.findUnique({
      where: { id: userId },
      include: {
        // Social & Links
        links: true,
        referrals: { include: { referee: true } }, // Users invited by this user
        refereed: { include: { referrer: true } }, // Who invited this user

        // Airdrops & Balances
        userTokens: { include: { token: true } },
        wallets: { include: { asset: true } },

        // Financial History
        WalletTransactions: {
          include: { asset: true, network: true },
          orderBy: { createdAt: "desc" },
          take: 100,
        },
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 100,
        },

        // Trading Data
        orders: {
          include: { pair: true },
          orderBy: { createdAt: "desc" },
        },
        positions: {
          include: { pair: true },
          where: { isOpen: true }, // Usually admins want to see active risk first
        },

        // Engagement
        leaderboardEntries: true,
      },
    });
  }

  /**
   * 3. GET USER FINANCIAL STATUS & TOTALS
   * Aggregates sums for Deposits, Withdrawals, and Airdrops.
   */
  async getStatusSummary() {
    const [financials, airdrops] = await Promise.all([
      // Sum of completed Wallet Transactions by type
      prisma.walletTransaction.groupBy({
        by: ["type"],
        where: {
          status: AssetTransactionStatus.Completed,
        },
        _sum: { amount: true },
        _count: { id: true },
      }),

      // Sum of Airdrop Token balances
      prisma.userToken.aggregate({
        _sum: { balance: true },
        _count: { id: true },
      }),
    ]);

    // Map the grouped data for easy access
    const depositData = financials.find(
      (f) => f.type === AssetTransactionType.Deposit
    );
    const withdrawData = financials.find(
      (f) => f.type === AssetTransactionType.Withdraw
    );

    return {
      deposits: {
        totalAmount: depositData?._sum?.amount || 0,
        count: depositData?._count?.id || 0,
      },
      withdrawals: {
        totalAmount: withdrawData?._sum?.amount || 0,
        count: withdrawData?._count?.id || 0,
      },
      airdrops: {
        totalBalance: airdrops._sum.balance || 0,
        activeTokens: airdrops._count.id || 0,
      },
      // Calculate net flow (Deposits - Withdrawals)
      netOnChainFlow:
        (depositData?._sum?.amount || 0) - (withdrawData?._sum?.amount || 0),
    };
  }

  /**
   * 4. UPDATE USER STATUS (Admin Action)
   */
  async updateUserStatus(
    userId: number,
    status: "Active" | "Inactive" | "Pending"
  ) {
    return await prisma.user.update({
      where: { id: userId },
      data: { status },
    });
  }
}
