import { FastifyInstance } from "fastify";
import {
    getOrders,
    getPositions,
    getTransactions,
    getWalletTransactions,
} from "../../controllers/admin/financial.controller";
import { orderReportSchema, positionReportSchema, transactionReportSchema } from "../../schema/financial.schema";


async function adminFinancialRoutes(fastify: FastifyInstance) {
  fastify.get("/", getWalletTransactions);
  fastify.get("/orders", { schema: orderReportSchema }, getOrders);
  fastify.get("/positions", { schema: positionReportSchema }, getPositions);
  fastify.get("/transactions", { schema: transactionReportSchema }, getTransactions);
}

export default adminFinancialRoutes;
