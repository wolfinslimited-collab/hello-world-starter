import S from "fluent-json-schema";

export const walletChartSchema = {
  querystring: S.object().prop(
    "type",
    S.string().enum(["Deposit", "Withdraw", "Transfer", "Trade"]).required()
  ),
};

export const dateRangeSchema = {
  querystring: S.object()
    .prop("startDate", S.string().format("date"))
    .prop("endDate", S.string().format("date"))
};

export const pairSchema = {
  querystring: S.object()
    .prop("startDate", S.string().format("date"))
    .prop("endDate", S.string().format("date"))
    .prop("pairId", S.string().pattern('^[0-9]+$'))
};

export const walletAnalyticsSchema = {
  querystring: S.object()
    .prop("startDate", S.string().format("date"))
    .prop("endDate", S.string().format("date"))
    .prop("assetId", S.string().pattern('^[0-9]+$'))
};