import prisma from "../helpers/prisma";

export class AirdropService {
  private async _updateLeaderboard(tx: any, userId: number, amount: number) {
    if (amount <= 0) return;

    const now = new Date();

    // 1. Calculate Start Dates
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Calculate Start of Week (Monday)
    const d = new Date(now);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(d.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);

    const periods = [
      { type: "DAILY", date: startOfDay },
      { type: "WEEKLY", date: startOfWeek },
      { type: "MONTHLY", date: startOfMonth },
    ];

    for (const p of periods) {
      await tx.leaderboardEntry.upsert({
        where: {
          unique_user_period_entry: {
            userId,
            period: p.type as any,
            startDate: p.date,
          },
        },
        update: {
          score: { increment: amount },
        },
        create: {
          userId,
          period: p.type as any,
          startDate: p.date,
          score: amount,
        },
      });
    }
  }

  /**
   * 1. Get All Active Tokens with Progress
   */
  async getUserTokens(userId: number) {
    return await prisma.userToken.findMany({
      where: { userId },
      include: {
        token: {
          select: {
            id: true,
            name: true,
            symbol: true,
            slug: true,
            logoUrl: true,
            price: true,
          },
        },
      },
    });
  }

  /**
   * UPDATED: Now updates Leaderboard
   * Note: Refactored from updateMany to loop to calculate exact increments per token.
   */
  async multiplyBalances(userId: number, factor: number = 2) {
    try {
      return await prisma.$transaction(async (tx) => {
        // 1. Fetch current balances to know how much we are adding
        const userTokens = await tx.userToken.findMany({
          where: { userId },
        });

        const results = [];

        for (const ut of userTokens) {
          const increaseAmount = ut.balance * (factor - 1);

          if (increaseAmount > 0) {
            // Update Balance
            const updated = await tx.userToken.update({
              where: { id: ut.id },
              data: { balance: { multiply: factor } },
            });

            // Update Leaderboard
            await this._updateLeaderboard(tx, userId, increaseAmount);
            results.push(updated);
          }
        }
        return results;
      });
    } catch (error) {
      console.error("Error multiplying balances:", error);
      throw new Error("Failed to multiply balances");
    }
  }

  /**
   * 4. Append Static Amount
   * UPDATED: Now updates Leaderboard
   */
  async addStaticAmountEasy(userId: number, amount: number) {
    try {
      return await prisma.$transaction(async (tx) => {
        // We need to fetch tokens to map which tokenIds are being updated
        const userTokens = await tx.userToken.findMany({
          where: { userId },
          select: { tokenId: true },
        });

        // 1. Update All Balances
        const result = await tx.userToken.updateMany({
          where: { userId },
          data: {
            balance: { increment: amount },
          },
        });

        // 2. Update Leaderboard for each token found
        for (const ut of userTokens) {
          await this._updateLeaderboard(tx, userId, amount);
        }

        return result;
      });
    } catch (error) {
      console.error("Error appending amount:", error);
      throw new Error("Failed to append amount");
    }
  }

  /**
   * UPDATED: Now updates Leaderboard
   */
  async addStaticAmount(userId: number, amount: number) {
    try {
      const userTokens = await prisma.userToken.findMany({
        where: { userId },
        include: { token: true },
      });

      if (userTokens.length === 0) return [];

      // Wrapped in transaction to ensure leaderboard stays in sync
      const updatedRows = await prisma.$transaction(async (tx) => {
        const results = [];
        for (const ut of userTokens) {
          // Update Balance
          const updated = await tx.userToken.update({
            where: { id: ut.id },
            data: { balance: { increment: amount } },
            include: { token: true },
          });

          // Update Leaderboard
          await this._updateLeaderboard(tx, userId, amount);
          results.push(updated);
        }
        return results;
      });

      return updatedRows.map((row) => {
        const t = row.token as any;
        return {
          id: t.id,
          name: t.name,
          symbol: t.symbol,
          logoUrl: t.logoUrl ?? null,
          price: t.price,
          amount: amount,
        };
      });
    } catch (error) {
      console.error("Error appending amount:", error);
      throw new Error("Failed to append amount");
    }
  }

  async getTokens() {
    // const now = new Date();
    const tokens = await prisma.airdropToken.findMany({
      where: {
        isActive: true,
        // startsAt: { lte: now },
        // endsAt: { gt: now },
      },
      orderBy: [{ id: "desc" }],
    });

    return tokens.map((token) => {
      const progress = (token.totalClaimed / token.totalSupply) * 100;
      return {
        ...token,
        progress: parseFloat(progress.toFixed(2)),
      };
    });
  }

  /**
   * 2. Claim Initial Tokens (BATCH)
   * UPDATED: Now updates Leaderboard
   */
  async claimAllInitialTokens(userId: number) {
    const now = new Date();

    return prisma.$transaction(async (tx) => {
      // A. Find all valid global tokens
      const validTokens = await tx.airdropToken.findMany({
        where: {
          isActive: true,
          startsAt: { lte: now },
          endsAt: { gt: now },
        },
      });

      if (validTokens.length === 0) return { claimedCount: 0, tokens: [] };

      // B. Find what the user ALREADY has
      const userExistingTokens = await tx.userToken.findMany({
        where: { userId },
        select: { tokenId: true },
      });

      const existingTokenIds = new Set(
        userExistingTokens.map((ut) => ut.tokenId)
      );

      // C. Filter for NEW tokens only
      const tokensToClaim = validTokens.filter(
        (token) => !existingTokenIds.has(token.id)
      );

      if (tokensToClaim.length === 0) return { claimedCount: 0, tokens: [] };

      // D. Process Claims
      const results = [];

      for (const token of tokensToClaim) {
        if (token.totalClaimed > token.totalSupply) {
          continue;
        }

        // Create User Record
        await tx.userToken.create({
          data: {
            userId,
            tokenId: token.id,
            balance: token.initialAirdrop,
            lastActionAt: now,
          },
        });

        // Update Global Stats
        await tx.airdropToken.update({
          where: { id: token.id },
          data: { totalClaimed: { increment: token.initialAirdrop } },
        });

        // --- UPDATE LEADERBOARD ---
        await this._updateLeaderboard(tx, userId, token.initialAirdrop);

        results.push({
          logo: token.logoUrl,
          name: token.name,
          symbol: token.symbol,
          amount: token.initialAirdrop,
        });
      }

      return {
        claimedCount: results.length,
        claimedTokens: results,
      };
    });
  }

  /**
   * 3. Claim Daily Rewards (BATCH)
   * UPDATED: Now updates Leaderboard
   */
  async claimAllDailyTokens(userId: number, multiplier: number = 1) {
    const now = new Date();

    return prisma.$transaction(async (tx) => {
      const userTokens = await tx.userToken.findMany({
        where: {
          userId,
          token: {
            isActive: true,
            startsAt: { lte: now },
            endsAt: { gt: now },
          },
        },
        include: { token: true },
      });

      if (userTokens.length === 0) {
        throw new Error("No active tokens found for this user");
      }

      const results = [];

      for (const userToken of userTokens) {
        const lastClaimTime = new Date(userToken.lastActionAt).getTime();
        const hoursSince = (now.getTime() - lastClaimTime) / (1000 * 60 * 60);

        if (hoursSince < 24) continue;

        const reward = userToken.token.dailyReward * multiplier;

        if (
          userToken.token.totalClaimed + reward >
          userToken.token.totalSupply
        ) {
          continue;
        }

        await tx.userToken.update({
          where: { id: userToken.id },
          data: {
            balance: { increment: reward },
            lastActionAt: now,
          },
        });

        await tx.airdropToken.update({
          where: { id: userToken.tokenId },
          data: { totalClaimed: { increment: reward } },
        });

        // --- UPDATE LEADERBOARD ---
        await this._updateLeaderboard(tx, userId, reward);

        results.push({
          symbol: userToken.token.symbol,
          reward: reward,
          multiplier: multiplier,
        });
      }

      return {
        claimedCount: results.length,
        details: results,
        message:
          results.length > 0
            ? "Daily rewards claimed successfully"
            : "No rewards ready yet (check back later)",
      };
    });
  }

  /**
   * Single Daily Claim
   * UPDATED: Now updates Leaderboard
   */
  async claimDailyToken(
    userId: number,
    tokenId: number,
    multiplier: number = 1
  ) {
    const now = new Date();

    const token = await prisma.airdropToken.findUnique({
      where: { id: tokenId },
    });

    if (!token) throw new Error("Token not found");
    if (!token.isActive) throw new Error("Airdrop paused");
    if (now > token.endsAt) throw new Error("Airdrop has ended");

    const rewardAmount = token.dailyReward * multiplier;

    if (token.totalClaimed + rewardAmount > token.totalSupply) {
      throw new Error("Global airdrop cap reached");
    }

    return prisma.$transaction(async (tx) => {
      let userToken = await tx.userToken.findUnique({
        where: {
          userId_tokenId: { userId, tokenId },
        },
      });

      if (userToken) {
        const lastClaim = new Date(userToken.lastActionAt).getTime();
        const currentTime = now.getTime();
        const hoursSinceLastClaim =
          (currentTime - lastClaim) / (1000 * 60 * 60);

        if (hoursSinceLastClaim < 24) {
          const hoursRemaining = Math.ceil(24 - hoursSinceLastClaim);
          throw new Error(
            `Daily claim not ready. Try again in ${hoursRemaining} hours.`
          );
        }

        userToken = await tx.userToken.update({
          where: { id: userToken.id },
          data: {
            balance: { increment: rewardAmount },
            lastActionAt: now,
            updatedAt: now,
          },
        });
      } else {
        userToken = await tx.userToken.create({
          data: {
            userId,
            tokenId: tokenId,
            balance: rewardAmount,
            lastActionAt: now,
          },
        });
      }

      await tx.airdropToken.update({
        where: { id: tokenId },
        data: {
          totalClaimed: { increment: rewardAmount },
        },
      });

      // --- UPDATE LEADERBOARD ---
      await this._updateLeaderboard(tx, userId, rewardAmount);

      return {
        userToken: { ...userToken, token },
        rewardClaimed: rewardAmount,
        multiplierApplied: multiplier,
      };
    });
  }
}
