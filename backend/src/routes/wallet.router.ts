import { FastifyInstance } from "fastify";
import * as controllers from "../controllers";
import { authorize } from "../middlewares";
import { depositSchema, withdrawSchema } from "../schema";

async function walletRouter(fastify: FastifyInstance) {
  fastify.route({
    method: "GET",
    url: "/assets",
    handler: controllers.assets,
  });

  fastify.route({
    method: "GET",
    url: "/",
    preHandler: [authorize],
    handler: controllers.userWallet,
  });

  fastify.route({
    method: "POST",
    url: "/deposit",
    schema: depositSchema,
    preHandler: [authorize],
    handler: controllers.deposit,
  });

  fastify.route({
    method: "POST",
    url: "/withdraw",
    schema: withdrawSchema,
    preHandler: [authorize],
    handler: controllers.withdraw,
  });
}

export default walletRouter;
