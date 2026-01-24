import { FastifyReply, FastifyRequest } from "fastify";
import { FinancialService } from "../../services/admin/financial.service";
import { error, success } from "../../helpers/reply";
import { AssetTransactionStatus, AssetTransactionType } from "@prisma/client";

const service = new FinancialService();

export const getWalletTransactions = async (request: FastifyRequest, reply: FastifyReply) => {
  const { page, limit, type, status, userId } = request.query as any;
  const result = await service.getWalletTransactions(
    parseInt(page || "1"),
    parseInt(limit || "20"),
    type as AssetTransactionType,
    status as AssetTransactionStatus,
    userId,
  );
  success(reply, result);
};

export const getPositions = async (request: FastifyRequest, reply: FastifyReply) => {
  const { page, limit, userId, id, isOpen, pairId } = request.query as any;
  const result = await service.getPosition(
    parseInt(page || "1"),
    parseInt(limit || "20"),
    {userId, id, isOpen: Boolean(isOpen), pairId },
  );
  success(reply, result);
};

export const getTransactions = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { page, limit, userId, tag, type } = request.query as any;
    const result = await service.getUserTransactions(
      parseInt(page || "1"),
      parseInt(limit || "20"),
      { userId: userId ? parseInt(userId) : undefined, tag, type }
    );
    success(reply, result);
  } catch (err) {
    error(reply, "TRANSACTION_LIST_ERROR", err);
  }
};

export const getOrders = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { page, limit, userId, status, pairId } = request.query as any;
    const result = await service.getOrdersList(
      parseInt(page || "1"),
      parseInt(limit || "20"),
      { 
        userId: userId ? parseInt(userId) : undefined, 
        status, 
        pairId: pairId ? parseInt(pairId) : undefined 
      }
    );
    success(reply, result);
  } catch (err) {
    error(reply, "ORDER_LIST_ERROR", err);
  }
};