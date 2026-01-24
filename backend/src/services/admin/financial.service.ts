import prisma from "../../helpers/prisma";
import {
  AssetTransactionStatus,
  AssetTransactionType,
  OrderStatus,
  TransactionTag,
  TransactionType,
} from "@prisma/client";

export class FinancialService {
  async getWalletTransactions(
    page: number = 1,
    limit: number = 20,
    type?: AssetTransactionType,
    status?: AssetTransactionStatus,
    userId?: Number,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (type) where.type = type;
    if (userId) where.userId = userId;
    if (status) where.status = status;

    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, fullName: true, links: true } },
          asset: true,
          network: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.walletTransaction.count({ where }),
    ]);

    return { transactions, total };
  };

  async getPosition(
    page: number = 1,
    limit: number = 20,
    filters: { id?: Number, userId?: number; isOpen?: boolean; pairId?: number }
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (filters?.id) where.id = filters?.id;
    if (filters?.pairId) where.pairId = filters?.pairId;
    if (filters?.userId) where.userId = filters?.userId;
    if (filters?.isOpen) where.isOpen = filters?.isOpen;

    const [positions, total] = await Promise.all([
      prisma.position.findMany({
        where,
        skip,
        take: limit,
        include: {
          users: { select: { fullName: true, id: true, links: true } },
          pair: {select: { symbol: true, type: true, provider: true }}
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.position.count({ where }),
    ]);

    return { positions, total };
  };

  async getUserTransactions(
    page: number = 1,
    limit: number = 20,
    filters: { userId?: number; tag?: TransactionTag; type?: TransactionType }
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.tag) where.tag = filters.tag;
    if (filters.type) where.type = filters.type;

    const [transaction, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        include: { user: { select: { fullName: true, id: true, links: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.transaction.count({ where }),
    ]);

    return { transaction, total };
  }

  async getOrdersList(
    page: number = 1,
    limit: number = 20,
    filters: { userId?: number; status?: OrderStatus; pairId?: number }
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.status) where.status = filters.status;
    if (filters.pairId) where.pairId = filters.pairId;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          pair: true,
          users: { select: { id: true, fullName: true, links: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.count({ where }),
    ]);

    return { orders, total };
  }
}
