import { FastifyInstance } from "fastify";
import * as controllers from "../controllers"; // Adjust path as needed
import { authorize } from "../middlewares";
import { tokenSchema } from "../schema";

async function airdropRouter(fastify: FastifyInstance) {
  fastify.route({
    method: "GET",
    url: "/list",
    handler: async (request, reply) => {
      return await controllers.getActiveAirdrops(request, reply);
    },
  });

  fastify.route({
    method: "POST",
    url: "/claimInit",
    preHandler: [authorize],
    handler: async (request, reply) => {
      return await controllers.claimInitialAirdrops(request, reply);
    },
  });

  fastify.route({
    method: "POST",
    url: "/claim",
    preHandler: [authorize],
    schema: tokenSchema,
    handler: async (request, reply) => {
      return await controllers.claimDailyToken(request, reply);
    },
  });

  fastify.route({
    method: "POST",
    url: "/claimAll",
    preHandler: [authorize],
    handler: async (request, reply) => {
      return await controllers.claimDailyRewards(request, reply);
    },
  });
}

export default airdropRouter;
