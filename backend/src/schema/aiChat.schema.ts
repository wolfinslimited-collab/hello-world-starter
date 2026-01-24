import S from "fluent-json-schema";

class ClientAIChatSchema {
  // Get conversation list (paginated)
  conversationList = {
    querystring: S.object()
      .additionalProperties(false)
      .prop("uid", S.string())
      .prop("page", S.number().minimum(1).default(1))
      .prop("limit", S.number().minimum(1).maximum(50).default(20)),
  };
  conversationEnd = {
    querystring: S.object().additionalProperties(false).prop("uid", S.string()),
  };

  aiMode = {
    params: S.object().prop("conversationId", S.number().required()),
  };
  // Get messages for a conversation
  messageList = {
    params: S.object()
      .additionalProperties(false)
      .prop("conversationId", S.number().required()),
    querystring: S.object()
      .additionalProperties(false)
      .prop("uid", S.string())
      .prop("page", S.number().minimum(1).default(1))
      .prop("limit", S.number().minimum(1).maximum(100).default(20)),
  };
  feedBack = {
    params: S.object().prop("messageId", S.number().required()),
    body: S.object().prop("feedback", S.string()),
  };

  // Send message
  sendMessage = {
    body: S.object()
      .additionalProperties(false)
      .prop("cId", S.number())
      .prop("uid", S.string())
      .prop("email", S.string())
      .prop("currentUrl", S.string())
      .prop("image", S.string())
      .prop("text", S.string().minLength(1).maxLength(2000).required()),
  };
}

export default new ClientAIChatSchema();
