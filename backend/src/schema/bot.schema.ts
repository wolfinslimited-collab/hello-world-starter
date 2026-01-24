import S from "fluent-json-schema";

export const userLoginSchema = {
  body: S.object()
    .prop("chain", S.string().required())
    .prop("address", S.string().required())
    .prop("signature", S.string().required())
    .prop("refId", S.number()),
};

export const botSyncSchema = {
  body: S.object()
    .prop("mine", S.number().minimum(1).required())
    .prop("version", S.string().required())
    .prop("key", S.string().minLength(6).maxLength(6).required()),
  queryString: S.object(),
  params: S.object(),
  headers: S.object(),
};
export const botBoostSchema = {
  body: S.object().prop("type", S.string().required()),
  queryString: S.object(),
  params: S.object(),
  headers: S.object(),
};
export const botPaySchema = {
  body: S.object()
    .prop("type", S.string().required())
    .prop("boost", S.number()),
  queryString: S.object(),
  params: S.object(),
  headers: S.object(),
};

export const botLevelSchema = {
  queryString: S.object(),
  params: S.object()
    .prop("level", S.string().required())
    .prop("type", S.string().required()),
  headers: S.object(),
};

export const friendsSchema = {
  params: S.object(),
  headers: S.object(),
  querystring: S.object()
    .prop("page", S.number().default(1))
    .prop("limit", S.number().maximum(100).minimum(1).default(10))
    .prop("sort", S.enum(["asc", "desc"]).default("desc")),
};

export const botTaskSchema = {
  body: S.object().prop("id", S.number().required()),
};
export const botAddressSchema = {
  body: S.object()
    .prop("coin", S.string().required())
    .prop("address", S.string().required()),
};
export const botTask2Schema = {
  body: S.object().prop("key", S.string().required()),
};
export const botDataSchema = {
  body: S.object().prop("send", S.array().required()),
};

export const botDepositSchema = {
  body: S.object()
    .prop("amount", S.number().required())
    .prop("priority", S.string().required()),
};
export const boostSchema = {
  body: S.object()
    .prop("boost", S.number().required())
    .prop("txId", S.string().required()),
};
export const upgradeSchema = {
  body: S.object().prop("walletId", S.number().required()),
};
export const updateSchema = {
  body: S.object().prop("fullName", S.string()),
};
export const tokenSchema = {
  body: S.object().prop("tokenId", S.number().required()),
};
export const missionSchema = {
  body: S.object().prop("missionId", S.number().required()),
};
export const botDepositListSchema = {
  params: S.object().prop("level", S.string().required()),
};

export const botSwapSchema = {
  body: S.object()
    .prop("amount", S.number().required())
    .prop("receive", S.number().required())
    .prop("from", S.string().required())
    .prop("to", S.string().required())
    .prop("key", S.string().minLength(6).maxLength(6).required()),
};
export const botPrizeSchema = {
  body: S.object().prop("amount", S.number().maximum(20).minimum(5).required()),
};

export const requestSchema = {
  body: S.object()
    .prop("address", S.string().required())
    .prop("txid", S.string()),
  headers: S.object(),
};
export const swapSchema = {
  body: S.object().prop("amount", S.number().minimum(1).required()),
  headers: S.object(),
};

export const verifySchema = {
  queryString: S.object(),
  params: S.object()
    .prop("refId", S.number().required())
    .prop("tlgId", S.number().required()),
  headers: S.object(),
};
export const statusSchema = {
  queryString: S.object(),
  params: S.object().prop("tlgId", S.number().required()),
  headers: S.object(),
};

export const depositSchema = {
  body: S.object()
    .prop("txId", S.string().required())
    .prop("amount", S.number().minimum(0).required())
    .prop("assetId", S.number().required())
    .prop("networkId", S.number().required())
    .prop("fromAddress", S.string().required()),
};

export const withdrawSchema = {
  body: S.object()
    .prop("assetId", S.number().required())
    .prop("networkId", S.number().required())
    .prop("amount", S.number().exclusiveMinimum(0).required())
    .prop("toAddress", S.string().required()),
};
