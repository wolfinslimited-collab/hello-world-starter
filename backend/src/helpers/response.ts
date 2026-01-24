const logger = require("pino")();
import { FastifyReply, FastifyRequest } from "fastify";
import { IResponseException, InternalServerErrorException } from "./errors";

export const ErrorResponse = (
  req: FastifyRequest,
  res: FastifyReply,
  error: Error
) => {
  if (process.env.NODE_ENV == "development") {
    console.log(error);
  }
  if (error instanceof IResponseException) {
    const e = error as IResponseException;
    const resp = {
      error: e.name,
      statusCode: e.statusCode,
      message: e.message,
      data: error,
    };
    return res.status(e.statusCode).send(resp);
  } else {
    var e = new InternalServerErrorException();
    const resp = {
      error: e.name,
      statusCode: e.statusCode,
      message: e.message,
      data: error,
    };
    return res.status(500).send(resp);
  }
};

export const SuccessResponse = (
  res: FastifyReply,
  { statusCode = 200, message = null, data = null }
) => {
  const resp = {
    error: null,
    statusCode,
    message,
    data,
  };
  return res.status(statusCode).send(resp);
};
