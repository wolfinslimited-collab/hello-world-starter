import S from "fluent-json-schema";

export const transactionReportSchema = {
  querystring: S.object()
    .prop("page", S.string().default("1"))
    .prop("limit", S.string().default("20"))
    .prop("userId", S.string())
    .prop("tag", S.string().enum(["Referral", "Spend", "Task", "Prize", "Gift", "Join", "Reward", "Withdraw", "Deposit", "Hold", "Daily", "Activate"]))
    .prop("type", S.string().enum(["In", "Out"]))
};

export const orderReportSchema = {
  querystring: S.object()
    .prop("page", S.string().default("1"))
    .prop("limit", S.string().default("20"))
    .prop("userId", S.string())
    .prop("status", S.string().enum(["PENDING", "OPEN", "FILLED", "CANCELED", "FAILED"]))
    .prop("pairId", S.string())
};
export const positionReportSchema = {
  querystring: S.object()
    .prop("page", S.string().default("1"))
    .prop("limit", S.string().default("20"))
    .prop("id", S.string())
    .prop("isOpen", S.string().enum([1, 0]))
    .prop("userId", S.string())
    .prop("pairId", S.string())
};