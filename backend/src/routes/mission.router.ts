import { FastifyInstance } from "fastify";
import * as controllers from "../controllers";
import { authorize } from "../middlewares";
import { missionSchema } from "../schema";

async function botRouter(fastify: FastifyInstance) {
  fastify.route({
    method: "GET",
    url: "/",
    handler: async (request, reply) => {
      return await controllers.getMissionList(request, reply);
    },
  });
  fastify.route({
    method: "GET",
    url: "/user",
    preHandler: [authorize],
    handler: async (request, reply) => {
      return await controllers.getUserMissions(request, reply);
    },
  });
  fastify.route({
    method: "POST",
    url: "/claim",
    preHandler: [authorize],
    schema: missionSchema,
    handler: async (request, reply) => {
      return await controllers.getMissionRewards(request, reply);
    },
  });
}

export default botRouter;
