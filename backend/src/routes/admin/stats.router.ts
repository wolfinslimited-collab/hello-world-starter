import { FastifyInstance } from "fastify";
import {
  getAirdropAnalytics,
  getUserAnalytics,
  getOrderAnalytics,
  getWalletAnalytics
} from "../../controllers/admin/stats.controller";
import { dateRangeSchema, walletAnalyticsSchema, pairSchema } from "../../schema/stats.schema";

async function adminStatesRoutes(fastify: FastifyInstance) {
  fastify.get("/users-stats", {schema: dateRangeSchema}, getUserAnalytics);
  fastify.get("/order-stats", {schema: pairSchema}, getOrderAnalytics);
  fastify.get("/airdrop-stats", {schema: dateRangeSchema}, getAirdropAnalytics);
  fastify.get("/wallet-stats", {schema: walletAnalyticsSchema}, getWalletAnalytics);
};

export default adminStatesRoutes;