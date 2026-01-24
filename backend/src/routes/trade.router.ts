import { FastifyInstance } from "fastify";
import * as controllers from "../controllers"; // We will add trade controllers here
import { authorize } from "../middlewares";
import {
  submitOrderSchema,
  getOrdersSchema,
  getHistorySchema,
} from "../schema/trade.schema"; // Adjust import path as needed

async function tradeRouter(fastify: FastifyInstance) {
  // --- PUBLIC ROUTES ---

  fastify.route({
    method: "GET",
    url: "/pairs",
    handler: controllers.pairs,
  });

  // --- PROTECTED ROUTES (Require Login) ---

  // 1. Submit New Order
  fastify.route({
    method: "POST",
    url: "/order",
    schema: submitOrderSchema,
    preHandler: [authorize], // User must be logged in
    handler: controllers.submitOrder,
  });

  // 2. Cancel Order
  fastify.route({
    method: "GET",
    url: "/cancel/:id",
    preHandler: [authorize],
    handler: controllers.cancelOrder,
  });
  fastify.route({
    method: "GET",
    url: "/close/:id",
    preHandler: [authorize],
    handler: controllers.closePosition,
  });

  // 3. Get Open Orders
  fastify.route({
    method: "GET",
    url: "/orders",
    schema: getOrdersSchema,
    preHandler: [authorize],
    handler: controllers.getOpenOrders,
  });

  // 4. Get Open Positions (Futures PnL)
  fastify.route({
    method: "GET",
    url: "/positions",
    preHandler: [authorize],
    handler: controllers.getPositions,
  });

  // 5. Get Trade History
  fastify.route({
    method: "GET",
    url: "/history",
    schema: getHistorySchema,
    preHandler: [authorize],
    handler: controllers.getHistory,
  });
}

export default tradeRouter;
