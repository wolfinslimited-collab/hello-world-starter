import {
  PrismaClient,
  OrderType,
  OrderSide,
  TradingPair,
} from "@prisma/client";
import axios from "axios";
import * as crypto from "crypto";
import { math } from "../helpers/mathUtils";
import prisma from "../helpers/prisma";

// --- TYPES ---
interface TradeRequest {
  userId: number;
  pair: number;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price?: number;
  leverage?: number;
  isIsolated?: boolean;
}

interface OrderResponse {
  success: boolean;
  orderId?: number;
  message?: string;
}

export class TradingService {
  // ==========================================
  // SECTION A: TRADING (FRONTEND INPUT)
  // ==========================================

  /**
   * SUBMIT ORDER
   * 1. Validates Balance
   * 2. Locks Funds (DB)
   * 3. Sends to Aster
   * 4. Updates DB with External ID
   */
  async submitOrder(req: TradeRequest): Promise<OrderResponse> {
    // 1. Fetch Pair & Rules
    const pair = await prisma.tradingPair.findUnique({
      where: { id: req.pair },
      include: { quoteAsset: true },
    });
    if (!pair || !pair.active) throw new Error("Pair not active or found");

    // 2. Calculate Required Margin with Precision
    const leverage = req.leverage || 1;
    const priceForCalc =
      req.type === "MARKET" ? await this.getMarketPrice(pair) : req.price!;
    if (!priceForCalc) throw new Error("Invalid Price");

    // Use library for margin calculation: (quantity * price) / leverage
    const notionalValue = math.mul(req.quantity, priceForCalc);
    const requiredMargin = math.div(notionalValue, leverage);

    let orderId: number | null = null;

    try {
      // 3. DATABASE TRANSACTION (Lock Funds)
      const order = await prisma.$transaction(async (tx) => {
        const wallet = await tx.wallet.findUnique({
          where: {
            userId_assetId: { userId: req.userId, assetId: pair.quoteAssetId },
          },
        });

        // Comparison: Convert Decimal/Float to number for the check
        if (!wallet || Number(wallet.balance) < requiredMargin) {
          throw new Error(`Insufficient ${pair.quoteAsset.symbol} Balance`);
        }

        // Calculate new states using library
        const newBalance = math.mine(Number(wallet.balance), requiredMargin);
        const newLocked = math.sum(Number(wallet.locked), requiredMargin);

        // Apply updates
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: newBalance,
            locked: newLocked,
          },
        });

        return await tx.order.create({
          data: {
            userId: req.userId,
            pairId: pair.id,
            side: req.side,
            type: req.type,
            quantity: req.quantity,
            price: req.price,
            leverage: leverage,
            isIsolated: req.isIsolated ?? true,
            status: "PENDING",
          },
        });
      });

      orderId = order.id;

      // 4. EXECUTE ON EXCHANGE
      let externalId = "";
      if (pair.provider === "ASTER") {
        externalId = await this.executeOnAster(pair, req);
      }

      // 5. SUCCESS: Finalize Order
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "OPEN", externalId: externalId.toString() },
      });

      this.syncOrder(orderId).catch(console.error);

      return {
        success: true,
        orderId,
        message: "Order Submitted Successfully",
      };
    } catch (error: any) {
      console.error("Trade Failed:", error.message);

      // 6. ROLLBACK / FAIL SAFE
      if (orderId) {
        await prisma.$transaction(async (tx) => {
          // A. Mark order as failed
          await tx.order.update({
            where: { id: orderId! },
            data: { status: "FAILED", errorMessage: error.message },
          });

          // B. UNLOCK FUNDS (Precision Reversal)
          // We fetch the wallet again because the previous transaction committed
          const wallet = await tx.wallet.findUnique({
            where: {
              userId_assetId: {
                userId: req.userId,
                assetId: pair.quoteAssetId,
              },
            },
          });

          if (wallet) {
            // Reverse the logic: Add back to balance, remove from locked
            const reversedBalance = math.sum(
              Number(wallet.balance),
              requiredMargin
            );
            const reversedLocked = math.mine(
              Number(wallet.locked),
              requiredMargin
            );

            await tx.wallet.update({
              where: { id: wallet.id },
              data: {
                balance: reversedBalance,
                locked: reversedLocked,
              },
            });
          }
        });
      }
      throw new Error(error.message);
    }
  }

  /**
   * CANCEL ORDER
   * Can be triggered by User or System
   */
  async cancelOrder(userId: number, orderId: number) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { pair: true },
    });

    if (!order || ["FILLED", "CANCELED", "FAILED"].includes(order.status)) {
      throw new Error("Order cannot be canceled");
    }

    try {
      // 1. Call External Exchange to Cancel
      if (order.externalId && order.pair.provider === "ASTER") {
        await this.cancelOnAster(order.pair, order.externalId);
      }

      // 2. Database Revert (Unlock remaining funds)
      await prisma.$transaction(async (tx) => {
        // Mark Order as Canceled
        await tx.order.update({
          where: { id: orderId },
          data: { status: "CANCELED" },
        });

        // A. Calculate remaining quantity to refund: (quantity - filledQty)
        const remainingQty = math.mine(
          Number(order.quantity),
          Number(order.filledQty)
        );

        if (remainingQty <= 0) return; // Nothing left to refund

        // B. Calculate refund amount based on remaining quantity
        // Logic: (remainingQty * price) / leverage
        const initialPrice = Number(order.price || order.avgFillPrice || 0);
        const notionalValue = math.mul(remainingQty, initialPrice);
        const refundAmount = math.div(notionalValue, Number(order.leverage));

        if (refundAmount > 0) {
          // C. Fetch current wallet state (Required for application-side math)
          const wallet = await tx.wallet.findUnique({
            where: {
              userId_assetId: {
                userId: order.userId,
                assetId: order.pair.quoteAssetId,
              },
            },
          });

          if (wallet) {
            // D. Calculate new absolute totals
            const newLocked = math.mine(Number(wallet.locked), refundAmount);
            const newBalance = math.sum(Number(wallet.balance), refundAmount);

            // E. Update Wallet with absolute values
            await tx.wallet.update({
              where: { id: wallet.id },
              data: {
                locked: newLocked,
                balance: newBalance,
              },
            });
          }
        }
      });

      return { success: true };
    } catch (e: any) {
      console.error("Cancel Error:", e.message);
      throw new Error(`Cancel failed: ${e.message}`);
    }
  }
  // ==========================================
  // SECTION B: SYNC ENGINE (CRUCIAL)
  // ==========================================
  // This function should be called by a Cron Job every 2 seconds
  // OR by a Webhook endpoint receiving updates from Aster.

  async syncOrder(orderId: number) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { pair: true },
    });
    if (
      !order ||
      !order.externalId ||
      order.status === "FILLED" ||
      order.status === "CANCELED"
    )
      return;

    // 1. Fetch Status from Aster
    const remoteOrder = await this.fetchAsterOrder(
      order.pair.externalSymbol,
      order.externalId
    );

    // remoteOrder example: { status: "FILLED", executedQty: "1.0", avgPrice: "50000" }

    const newFilledQty = parseFloat(remoteOrder.executedQty);
    const deltaQty = newFilledQty - order.filledQty;

    if (deltaQty <= 0 && remoteOrder.status === order.status) return; // No change

    // 2. Handle State Updates in DB Transaction
    await prisma.$transaction(async (tx) => {
      // A. Update Order
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: remoteOrder.status, // FILLED, PARTIALLY_FILLED, CANCELED
          filledQty: newFilledQty,
          avgFillPrice: parseFloat(remoteOrder.avgPrice),
        },
      });

      // B. Update Position (For PERPETUAL/FUTURES)
      if (deltaQty > 0) {
        // Calculate Margin used for this specific fill
        // We move this amount from 'Wallet Locked' to 'Position Margin'
        const fillCost =
          (deltaQty * parseFloat(remoteOrder.avgPrice)) / order.leverage;

        // 1. Decrease Wallet Locked (It's no longer just an order lock, it's now position money)
        // Actually, in many systems, Position Margin is tracked separately,
        // but for this schema, we just decrement locked and assume Position handles its own math.
        const wallet = await tx.wallet.findUnique({
          where: {
            userId_assetId: {
              userId: order.userId,
              assetId: order.pair.quoteAssetId,
            },
          },
        });

        if (wallet) {
          // 2. Calculate new locked balance using math.mine (subtraction)
          // Logic: Current Locked - fillCost
          let newLocked = math.mine(Number(wallet.locked), Number(fillCost));

          /**
           * 3. DUST PREVENTION (Safety Check)
           * In high-frequency trading, if newLocked is an extremely tiny
           * negative number (e.g., -1e-16) due to floating point limits
           * in other parts of the system, we force it to 0.
           */
          if (newLocked < 0) {
            newLocked = 0;
          }

          // 4. Update the wallet with the absolute value
          await tx.wallet.update({
            where: { id: wallet.id },
            data: {
              locked: newLocked,
            },
          });
        }

        // 2. Find or Create Position
        const positionSide = order.side === "BUY" ? "LONG" : "SHORT";

        // Upsert Logic manually because we need to calculate averages
        let position = await tx.position.findFirst({
          where: {
            userId: order.userId,
            pairId: order.pairId,
            side: positionSide,
            isOpen: true,
          },
        });

        if (position) {
          // Average Entry Price Calculation
          const currentVal = position.amount * position.entryPrice;
          const newVal = deltaQty * parseFloat(remoteOrder.avgPrice);
          const newAmount = position.amount + deltaQty;
          const newEntryPrice = (currentVal + newVal) / newAmount;

          await tx.position.update({
            where: { id: position.id },
            data: {
              amount: newAmount,
              entryPrice: newEntryPrice,
              margin: { increment: fillCost }, // Add margin to position
              updatedAt: new Date(),
            },
          });
        } else {
          // Create New Position
          await tx.position.create({
            data: {
              userId: order.userId,
              pairId: order.pairId,
              side: positionSide, // PositionSide enum
              entryPrice: parseFloat(remoteOrder.avgPrice),
              amount: deltaQty,
              leverage: order.leverage,
              margin: fillCost,
              isOpen: true,
            },
          });
        }
      }

      // C. If Order is CANCELED remotely (e.g. by exchange engine), unlock remaining funds
      if (
        remoteOrder.status === "CANCELED" ||
        remoteOrder.status === "EXPIRED"
      ) {
        const remainingQty = order.quantity - newFilledQty;
        // ... Logic to refund remainingQty * price / leverage to Wallet Balance
        // (Similar to cancelOrder function above)
      }
    });
  }

  async closePosition(userId: number, positionId: number) {
    const position = await prisma.position.findFirst({
      where: { id: positionId, userId, isOpen: true },
      include: { pair: true },
    });

    if (!position) throw new Error("Position not found");

    // To close a LONG, we SELL. To close a SHORT, we BUY.
    return await this.submitOrder({
      userId,
      pair: position.pair.id,
      side: position.side === "LONG" ? "SELL" : "BUY",
      type: "MARKET",
      quantity: position.amount,
      leverage: position.leverage,
    });
  }

  // ==========================================
  // SECTION C: FRONTEND GETTERS (UI DATA)
  // ==========================================
  async getActivePairs() {
    return await prisma.tradingPair.findMany({
      where: { active: true },

      include: {
        baseAsset: true,

        quoteAsset: { include: { networks: { include: { network: true } } } },
      },
    });
  }
  /**
   * GET OPEN ORDERS
   * Returns active orders for the UI
   */
  async getOpenOrders(userId: number, { pairId }: { pairId?: number }) {
    return await prisma.order.findMany({
      where: {
        userId,
        status: { in: ["PENDING", "OPEN"] }, // Only active
        pairId: pairId || undefined,
      },
      orderBy: { createdAt: "desc" },
      include: { pair: true },
    });
  }

  /**
   * GET POSITIONS (with LIVE PnL)
   * Calculates Unrealized PnL based on current market price
   */
  async getPositions(userId: number, { pairId }: { pairId?: number }) {
    const positions = await prisma.position.findMany({
      where: { userId, isOpen: true, pairId: pairId || undefined },
      include: { pair: true },
    });

    // We need live prices to calc PnL
    // In production, fetch these in bulk from Redis/Cache
    const results = [];

    for (const pos of positions) {
      const currentPrice = await this.getMarketPrice(pos.pair);

      // PnL Formula
      // Long: (Current - Entry) * Amount
      // Short: (Entry - Current) * Amount
      let upnl = 0;
      if (pos.side === "LONG") {
        upnl = (currentPrice - pos.entryPrice) * pos.amount;
      } else {
        upnl = (pos.entryPrice - currentPrice) * pos.amount;
      }

      // ROE (Return on Equity) %
      const roe = (upnl / pos.margin) * 100;

      results.push({
        ...pos,
        markPrice: currentPrice,
        unrealizedPnL: parseFloat(upnl.toFixed(2)),
        roe: parseFloat(roe.toFixed(2)),
      });
    }

    return results;
  }

  /**
   * GET TRADE HISTORY
   */
  async getHistory(userId: number, { pairId }: { pairId?: number }) {
    return await prisma.order.findMany({
      where: {
        userId,
        status: { in: ["FILLED", "CANCELED", "FAILED"] },
        pairId: pairId || undefined,
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: { pair: true },
    });
  }

  // ==========================================
  // SECTION D: PRIVATE ADAPTERS (ASTER)
  // ==========================================
  // Helper: robustly formats a number to a specific precision (truncating, not rounding)
  private formatPrecision(value: number, precision: number): string {
    // Avoid floating point math issues (e.g. 0.1 + 0.2 !== 0.3) by using strings or fixed logic
    const factor = Math.pow(10, precision);
    const truncated = Math.floor(value * factor) / factor;
    return truncated.toFixed(precision);
  }
  private async executeOnAster(
    pair: TradingPair,
    req: TradeRequest
  ): Promise<string> {
    const isPerp = pair.type === "PERPETUAL";
    const apiBase = isPerp
      ? "https://fapi.asterdex.com"
      : "https://sapi.asterdex.com";

    const headers = {
      "X-MBX-APIKEY": process.env.ASTER_KEY!,
      "Content-Type": "application/x-www-form-urlencoded", // Explicitly set content type
    };

    // Helper: Format numbers to string to avoid scientific notation or excess precision
    // Note: In production, use the pair's specific 'stepSize' and 'tickSize' here!
    const formatNum = (num: number, precision: number = 5) => {
      // Simple truncation to avoid 400 errors from too many decimals
      const factor = Math.pow(10, precision);
      return (Math.floor(num * factor) / factor).toFixed(precision);
    };

    // ===============================
    // 1. PERPETUAL SETUP (Margin/Leverage)
    // ===============================
    if (isPerp) {
      const symbol = pair.externalSymbol;

      // Note: We wrap these in try/catch silently because they fail if already set
      // but we shouldn't fail the whole trade for them.
      try {
        await this.setMarginType(
          apiBase,
          symbol,
          req.isIsolated ? "ISOLATED" : "CROSSED",
          headers
        );
        await this.setLeverage(apiBase, symbol, req.leverage ?? 1, headers);
      } catch (err) {
        // console.warn("Margin/Lev update skipped or failed", err.message);
      }
    }

    // ===============================
    // 2. BUILD ORDER BODY
    // ===============================

    const body: Record<string, any> = {
      symbol: pair.externalSymbol,
      side: req.side, // Ensure this is strictly "BUY" or "SELL"
      type: req.type, // Ensure this is strictly "LIMIT" or "MARKET"
      // FIX 1: formatting quantity to fix Precision Error
      quantity: this.formatPrecision(req.quantity, 0),
      timestamp: Date.now(),
      recvWindow: 10000, // Increased window to prevent timestamp errors
    };
    console.log(body);
    if (isPerp) {
      body.priceProtect = "TRUE";

      // FIX 2: Handle Hedge Mode.
      // If your account is Hedge Mode, 'positionSide' is MANDATORY.
      // If One-Way Mode, 'positionSide' is usually "BOTH" or omitted.
      // body.positionSide = req.positionSide || "BOTH";
    }

    if (req.type === "LIMIT") {
      if (!req.price) throw new Error("Price required for LIMIT order");
      // FIX 3: formatting price to fix Precision Error
      body.price = formatNum(req.price, pair.pricePrecision || 2);
      body.timeInForce = "GTC";
    }

    // ===============================
    // 3. SIGN & SEND
    // ===============================
    // Ensure the signature uses the EXACT string that will be sent
    const queryString = new URLSearchParams(body).toString();
    const signature = this.signRequest(body); // Ensure signRequest handles the object exactly as URLSearchParams orders it?
    // BETTER APPROACH: Sign the Query String directly if your signRequest supports it,
    // otherwise ensure 'body' order matches logic.

    // Construct final Query String
    const finalQuery = `${queryString}&signature=${signature}`;

    const orderEndpoint = isPerp ? "/fapi/v1/order" : "/api/v1/order";
    const fullUrl = `${apiBase}${orderEndpoint}?${finalQuery}`;

    try {
      // Note: Sending empty body {} with query params in URL is standard for Binance-likes
      const res = await axios.post(fullUrl, {}, { headers });
      return res.data.orderId;
    } catch (e: any) {
      // ===============================
      // 4. BETTER ERROR LOGGING
      // ===============================
      if (e.response && e.response.data) {
        console.error(
          "❌ Aster API Error Details:",
          JSON.stringify(e.response.data, null, 2)
        );
        // The exchange usually returns { code: -1111, msg: "Precision is over the maximum defined..." }
        throw new Error(
          `Aster Trade Failed [${e.response.data.code}]: ${e.response.data.msg}`
        );
      }

      console.error("❌ Network/Unknown Error:", e.message);
      throw new Error(`Aster Network Error: ${e.message}`);
    }
  }

  // Helper method to isolate side effects
  private async setMarginType(
    baseUrl: string,
    symbol: string,
    type: string,
    headers: any
  ) {
    const body = {
      symbol,
      marginType: type,
      timestamp: Date.now(),
      recvWindow: 5000,
    };
    const qs = new URLSearchParams(body as any).toString();
    const sig = this.signRequest(body);
    return axios.post(
      `${baseUrl}/fapi/v1/marginType?${qs}&signature=${sig}`,
      {},
      { headers }
    );
  }

  private async setLeverage(
    baseUrl: string,
    symbol: string,
    lev: number,
    headers: any
  ) {
    const body = {
      symbol,
      leverage: lev,
      timestamp: Date.now(),
      recvWindow: 5000,
    };
    const qs = new URLSearchParams(body as any).toString();
    const sig = this.signRequest(body);
    return axios.post(
      `${baseUrl}/fapi/v1/leverage?${qs}&signature=${sig}`,
      {},
      { headers }
    );
  }

  private async cancelOnAster(pair: any, orderId: string) {
    const params = {
      symbol: pair.externalSymbol,
      orderId: orderId,
      timestamp: Date.now(),
    };
    const signature = this.signRequest(params);
    const queryString = new URLSearchParams(params as any).toString();
    const api =
      pair.type === "SPOT"
        ? "https://sapi.asterdex.com/api/v1/order"
        : "https://fapi.asterdex.com/fapi/v1/order";
    await axios.delete(`${api}?${queryString}&signature=${signature}`, {
      headers: { "X-MBX-APIKEY": process.env.ASTER_KEY },
    });
  }

  private async fetchAsterOrder(symbol: string, orderId: string) {
    // Calls GET /fapi/v1/order
    const endpoint = "/fapi/v1/order";
    const params = {
      symbol: symbol,
      orderId: orderId,
      timestamp: Date.now(),
    };
    const signature = this.signRequest(params);
    const queryString = new URLSearchParams(params as any).toString();

    const res = await axios.get(
      `https://fapi.asterdex.com${endpoint}?${queryString}&signature=${signature}`,
      {
        headers: { "X-MBX-APIKEY": process.env.ASTER_KEY },
      }
    );

    return res.data;
    // Expected return: { status: "FILLED", executedQty: "0.5", avgPrice: "..." }
  }

  private signRequest(params: any): string {
    const queryString = new URLSearchParams(params).toString();
    return crypto
      .createHmac("sha256", process.env.ASTER_SECRET!)
      .update(queryString)
      .digest("hex");
  }

  private async getMarketPrice(pair: TradingPair): Promise<number> {
    try {
      const symbol = pair.externalSymbol;
      if (pair.provider == "ASTER") {
        const res = await axios.get(
          `https://fapi.asterdex.com/fapi/v1/ticker/price?symbol=${symbol}`
        );
        return parseFloat(res.data.price);
      }
      return 500000;
    } catch {
      return 500000; // Fallback for dev
    }
  }
}
