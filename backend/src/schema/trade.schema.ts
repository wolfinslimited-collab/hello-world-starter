import S from "fluent-json-schema";

// --- Enums for Validation ---
const OrderSide = ["BUY", "SELL"];
const OrderType = ["MARKET", "LIMIT"];

// 1. Submit Order Schema
export const submitOrderSchema = {
  body: S.object()
    .prop("pair", S.number().required())
    .prop("side", S.string().enum(OrderSide).required())
    .prop("type", S.string().enum(OrderType).required())
    .prop("quantity", S.number().minimum(0).required())
    .prop("price", S.number().minimum(0)) // Required only if LIMIT, handled in service logic mostly, but good to have
    .prop("leverage", S.number().minimum(1).default(1))
    .prop("isIsolated", S.boolean().default(true)),
};

// 2. Cancel Order Schema (ID in params)
export const cancelOrderSchema = {
  params: S.object().prop("id", S.number().required()),
};

// 3. Get Open Orders Schema (Optional query filter by pair)
export const getOrdersSchema = {
  querystring: S.object().prop("pairId", S.number()),
};

// 4. Get History Schema
export const getHistorySchema = {
  querystring: S.object()
    .prop("limit", S.number().default(50))
    .prop("page", S.number().default(1)),
};
