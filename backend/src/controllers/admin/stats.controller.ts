import { FastifyReply, FastifyRequest } from "fastify";
import { StatsService } from "../../services/admin/stats.service";
import { success, error } from "../../helpers/reply";

const service = new StatsService();

export const getUserAnalytics = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { startDate, endDate } = request.query as { startDate?: string; endDate?: string };
    const stats = await service.getUserStats(startDate, endDate);
    success(reply, stats);
  } catch (err) {
    error(reply, "USER_STATS_ERROR", err);
  }
};

export const getAirdropAnalytics = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { startDate, endDate } = request.query as { startDate?: string; endDate?: string };
    const stats = await service.getAirdropStats(startDate, endDate);
    success(reply, stats);
  } catch (err) {
    error(reply, "AIRDROP_STATS_ERROR", err);
  }
};

export const getWalletAnalytics = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { startDate, endDate, assetId } = request.query as { startDate?: string; endDate?: string, assetId?: string };
    const stats = await service.getWalletAnalytics(startDate, endDate, assetId ? parseInt(assetId) : undefined);
    success(reply, stats);
  } catch (err) {
    console.log({err});
    error(reply, "WALLET_TRANSACTION_STATS_ERROR", err);
  }
};

export const getOrderAnalytics = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { startDate, endDate, pairId } = request.query as { startDate?: string; endDate?: string, pairId?: string };
    const stats = await service.getOrderStats(startDate, endDate, pairId ? parseInt(pairId) : undefined);
    success(reply, stats);
  } catch (err) {
    error(reply, "ORDER_STATS_ERROR", err);
  }
};
