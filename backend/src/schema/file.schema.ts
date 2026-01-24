import S from "fluent-json-schema";

export const fileSchema = {
  queryString: S.object(),
  params: S.object()
    .prop("folder", S.string().required())
    .prop("name", S.string().required()),
  headers: S.object(),
};
export const telegramSchema = {
  queryString: S.object(),
  params: S.object().prop("userId", S.number().required()),
  headers: S.object(),
};
