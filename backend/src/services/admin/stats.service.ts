import prisma from "../../helpers/prisma";
import {
  AssetTransactionStatus,
  AssetTransactionType,
  Prisma,
} from "@prisma/client";
import { subDays, startOfDay, endOfDay } from "date-fns";

export class StatsService {
  private getDateRange(startDate?: string, endDate?: string) {
    const end = endDate ? endOfDay(new Date(endDate)) : endOfDay(new Date());
    const start = startDate
      ? startOfDay(new Date(startDate))
      : startOfDay(subDays(end, 30));

    return { gte: start, lte: end };
  }

  async getUserStats(startDate: string, endDate?: string) {
    const dateRange = this.getDateRange(startDate, endDate);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const totalUsers = await prisma.user.count();
    const todayUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });
    const periodUsers = await prisma.user.count({
      where: { createdAt: dateRange },
    });

    const chart: any[] = await prisma.$queryRaw`
      SELECT DATE_TRUNC('day', "createdAt") as date, COUNT(id)::int as count
      FROM "User"
      WHERE "createdAt" BETWEEN ${dateRange.gte} AND ${dateRange.lte}
      GROUP BY date ORDER BY date ASC
    `;

    return { totalUsers, periodUsers, chart, todayUsers };
  }

  async getOrderStats(startDate?: string, endDate?: string, pairId?: number) {
    const dateRange = this.getDateRange(startDate, endDate);
    const baseWhere: any = {
      createdAt: dateRange,
      ...(pairId && { pairId: pairId }),
    };

    const [statusGroups, sideStats, totalMetrics] = await Promise.all([
      prisma.order.groupBy({
        by: ["status"],
        where: baseWhere,
        _count: { id: true },
      }),
      prisma.order.groupBy({
        by: ["side"],
        where: { ...baseWhere, status: "FILLED" },
        _sum: { quantity: true, filledQty: true },
        _count: { id: true },
      }),
      prisma.order.aggregate({
        where: { ...baseWhere, status: "FILLED" },
        _sum: {
          quantity: true,
        },
      }),
    ]);

    const volumeChart: any[] = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', "createdAt") as date,
        side,
        COUNT(id)::int as "orderCount",
        SUM("filledQty") as "baseVolume",
        SUM("filledQty" * "avgFillPrice") as "quoteVolume"
      FROM "Order"
      WHERE 
        "status" = 'FILLED' 
        AND "createdAt" BETWEEN ${dateRange.gte} AND ${dateRange.lte}
        ${pairId ? Prisma.raw(`AND "pairId" = ${pairId}`) : Prisma.raw("")}
      GROUP BY date, side
      ORDER BY date ASC, side ASC
    `;

    const marketDepth: any[] = await prisma.$queryRaw`
      SELECT 
        SUM("filledQty" * "avgFillPrice") as "totalUsdVolume",
        AVG("avgFillPrice") as "averageExecutionPrice",
        MAX("avgFillPrice") as "highestPrice",
        MIN("avgFillPrice") as "lowestPrice"
      FROM "Order"
      WHERE "status" = 'FILLED' 
      AND "createdAt" BETWEEN ${dateRange.gte} AND ${dateRange.lte}
      ${pairId ? Prisma.raw(`AND "pairId" = ${pairId}`) : Prisma.raw("")}
    `;

    return {
      summary: {
        statusDistribution: statusGroups,
        sideDistribution: sideStats,
        totalUsdVolume: marketDepth[0]?.totalUsdVolume || 0,
        marketPriceRange: {
          high: marketDepth[0]?.highestPrice || 0,
          low: marketDepth[0]?.lowestPrice || 0,
          avg: marketDepth[0]?.averageExecutionPrice || 0,
        },
      },
      chart: volumeChart,
      range: { from: dateRange.gte, to: dateRange.lte },
    };
  }

  async getAirdropStats(startDate?: string, endDate?: string) {
    const dateRange = this.getDateRange(startDate, endDate);
    const [uniqueUsersCount, totalDistributed] = await Promise.all([
      prisma.userToken.groupBy({
        by: ['userId'],
        where: { createdAt: dateRange },
      }).then(groups => groups.length),

      prisma.userToken.aggregate({
        where: { createdAt: dateRange },
        _count: { id: true }
      })
    ]);

    const participationChart: any[] = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', "createdAt") as date, 
        COUNT(DISTINCT "userId")::int as "uniqueUsers",
        COUNT(id)::int as "totalActivations"
      FROM "UserToken"
      WHERE "createdAt" BETWEEN ${dateRange.gte} AND ${dateRange.lte}
      GROUP BY date 
      ORDER BY date ASC
    `;

    return {
      metrics: {
        uniqueUsersCount,
        totalActivations: totalDistributed._count.id,
      },
      chart: participationChart,
    };
  }

  async getWalletAnalytics(
    startDate?: string,
    endDate?: string,
    assetId?: number
  ) {
    const dateRange = this.getDateRange(startDate, endDate);

    const metrics: any[] = await prisma.$queryRaw`
      SELECT 
        "wt"."type",
        SUM("wt"."amount" * "a"."price")::float as "totalUsd",
        COUNT("wt"."id")::int as "count"
      FROM "WalletTransaction" "wt"
      JOIN "Asset" "a" ON "wt"."assetId" = "a"."id"
      WHERE 
        "wt"."status" = 'Completed' 
        AND "wt"."createdAt" BETWEEN ${dateRange.gte} AND ${dateRange.lte}
        ${
          assetId
            ? Prisma.raw(`AND "wt"."assetId" = ${assetId}`)
            : Prisma.raw("")
        }
      GROUP BY "wt"."type"
    `;

    const flowChart: any[] = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', "wt"."createdAt") as date,
        "wt"."type",
        COUNT("wt"."id")::int as count,
        SUM("wt"."amount" * "a"."price")::float as "totalUsdAmount"
      FROM "WalletTransaction" "wt"
      JOIN "Asset" "a" ON "wt"."assetId" = "a"."id"
      WHERE 
        "wt"."status" = 'Completed' 
        AND "wt"."createdAt" BETWEEN ${dateRange.gte} AND ${dateRange.lte}
        ${
          assetId
            ? Prisma.raw(`AND "wt"."assetId" = ${assetId}`)
            : Prisma.raw("")
        }
      GROUP BY date, "wt"."type"
      ORDER BY date ASC
    `;

    const depositData = metrics.find((m) => m.type === "Deposit") || {
      totalUsd: 0,
      count: 0,
    };
    const withdrawData = metrics.find((m) => m.type === "Withdraw") || {
      totalUsd: 0,
      count: 0,
    };

    return {
      metrics: {
        totalDepositsUsd: depositData.totalUsd,
        totalWithdrawalsUsd: withdrawData.totalUsd,
        summary: {
          depositCount: depositData.count,
          withdrawCount: withdrawData.count,
        },
      },
      chart: flowChart,
    };
  }
}
