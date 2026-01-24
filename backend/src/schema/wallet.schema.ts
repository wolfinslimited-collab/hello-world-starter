import S from "fluent-json-schema";

export const updateWalletTransactionSchema = {
  params: S.object().prop("walletTransactionId", S.string().required()),

  body: S.object().prop(
    "status",
    S.string().enum(["Rejected", "Accepted"]).required()
  ),

  headers: S.object(),
};

export const getUserWalletTranctionSchema = {
  params: S.object().prop("userId", S.number().required()),
  headers: S.object(),
};