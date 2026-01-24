import { FastifyReply } from "fastify";
import { error, success } from "../helpers/reply";
import { TradingService } from "../services/trading.service";

const tradingService = new TradingService();

// 1. Get Active Pairs
export const pairs = async (request: any, reply: FastifyReply) => {
  try {
    const data = await tradingService.getActivePairs();
    success(reply, data);
  } catch (err: any) {
    console.error(err);
    error(reply, "ERROR500", err.message);
  }
};

// 2. Submit Order
export const submitOrder = async (request: any, reply: FastifyReply) => {
  try {
    const userId = request.user.id;
    const body = request.body as any;

    const result = await tradingService.submitOrder({
      userId: userId,
      pair: body.pair,
      side: body.side,
      type: body.type,
      quantity: Number(body.quantity),
      price: body.price ? Number(body.price) : undefined,
      leverage: body.leverage,
      isIsolated: body.isIsolated,
    });

    success(reply, result);
  } catch (err: any) {
    console.error("Submit Order Error:", err);
    // Return a 400 error so the frontend knows the trade was rejected
    reply.status(400).send({ success: false, message: err.message });
  }
};

// 3. Cancel Order
export const cancelOrder = async (request: any, reply: FastifyReply) => {
  try {
    const userId = request.user.id;
    const { id } = request.params as { id: number };

    await tradingService.cancelOrder(userId, Number(id));
    success(reply, { message: "Order Canceled" });
  } catch (err: any) {
    console.error("Cancel Error:", err);
    reply.status(400).send({ success: false, message: err.message });
  }
};
export const closePosition = async (request: any, reply: FastifyReply) => {
  try {
    const userId = request.user.id;
    const { id } = request.params as { id: number };

    await tradingService.closePosition(userId, Number(id));
    success(reply, { message: "Order Canceled" });
  } catch (err: any) {
    console.error("Cancel Error:", err);
    reply.status(400).send({ success: false, message: err.message });
  }
};

// 4. Get Open Orders
export const getOpenOrders = async (request: any, reply: FastifyReply) => {
  try {
    const userId = request.user.id;
    const { pairId } = request.query as { pairId?: number };

    const data = await tradingService.getOpenOrders(userId, {
      pairId: Number(pairId),
    });
    success(reply, data);
  } catch (err: any) {
    console.error(err);
    error(reply, "ERROR500", err.message);
  }
};

// 5. Get Positions (Live PnL)
export const getPositions = async (request: any, reply: FastifyReply) => {
  try {
    const userId = request.user.id;
    const { pairId } = request.query as { pairId?: string };

    const data = await tradingService.getPositions(userId, {
      pairId: Number(pairId),
    });
    success(reply, data);
  } catch (err: any) {
    console.error(err);
    error(reply, "ERROR500", err.message);
  }
};

// 6. Get History
export const getHistory = async (request: any, reply: FastifyReply) => {
  try {
    const userId = request.user.id;
    const { pairId } = request.query as { pairId?: string };

    const data = await tradingService.getHistory(userId, {
      pairId: Number(pairId),
    });
    success(reply, data);
  } catch (err: any) {
    console.error(err);
    error(reply, "ERROR500", err.message);
  }
};
