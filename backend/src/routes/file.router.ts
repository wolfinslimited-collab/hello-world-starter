import { FastifyInstance } from "fastify";
import { fileSchema, telegramSchema } from "../schema";
import * as controllers from "../controllers";

async function userRouter(fastify: FastifyInstance) {
  fastify.route({
    method: "GET",
    url: "/:folder/:name",
    schema: fileSchema,
    handler: controllers.file,
  });
}

export default userRouter;
