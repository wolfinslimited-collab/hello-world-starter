import { ErrorResponse } from "../helpers/response";
import { UnAuthorizedErrorException } from "../helpers/errors";

export const WebhookAuth = async (request, reply) => {
  try {
    const secretKey = process.env.TRONKEEPER_WEBHOOK_SECRET_KEY;
    const requestSecretKey = request.params.secretKey;
    if (!secretKey || !requestSecretKey || secretKey != requestSecretKey) {
      throw new UnAuthorizedErrorException();
    }
  } catch (error) {
    return ErrorResponse(request, reply, new UnAuthorizedErrorException());
  }
};
