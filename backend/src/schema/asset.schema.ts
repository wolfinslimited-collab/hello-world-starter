import S from "fluent-json-schema";

export const updateAssetSchema = {
  params: S.object()
    .prop("id", S.number().required().description("Asset ID")),
  body: S.object()
    .prop("active", S.boolean())
    .prop("visible", S.boolean())
};

export const updateAssetNetworkSchema = {
  params: S.object()
    .prop("id", S.number().required().description("AssetNetwork ID")),
  body: S.object()
    .prop("isActive", S.boolean())
    .prop("canDeposit", S.boolean())
    .prop("canWithdraw", S.boolean())
    .prop("withdrawFee", S.number().minimum(0))
    .prop("minWithdraw", S.number().minimum(0))
    .prop("minDeposit", S.number().minimum(0))
};