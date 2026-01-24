import { FastifyInstance } from "fastify";
import {
  userLoginSchema,
  botTaskSchema,
  friendsSchema,
  upgradeSchema,
  updateSchema,
} from "../schema";
import * as controllers from "../controllers";
import { authorize } from "../middlewares";

async function botRouter(fastify: FastifyInstance) {
  fastify.route({
    method: "POST",
    url: "/auth",
    schema: userLoginSchema,
    handler: async (request, reply) => {
      return await controllers.userAuth(request, reply);
    },
  });

  fastify.route({
    method: "POST",
    url: "/link",
    preHandler: [authorize],
    schema: userLoginSchema,
    handler: async (request, reply) => {
      return await controllers.userLink(request, reply);
    },
  });

  fastify.route({
    method: "GET",
    url: "/profile",
    preHandler: [authorize],
    handler: async (request, reply) => {
      return await controllers.userProfile(request, reply);
    },
  });

  fastify.route({
    method: "POST",
    url: "/update",
    preHandler: [authorize],
    schema: updateSchema,
    handler: async (request, reply) => {
      return await controllers.userUpdate(request, reply);
    },
  });
  fastify.route({
    method: "POST",
    url: "/activate",
    preHandler: [authorize],
    schema: upgradeSchema,
    handler: async (request, reply) => {
      return await controllers.userActive(request, reply);
    },
  });

  fastify.route({
    method: "GET",
    url: "/leaderboard",
    // preHandler: [authorize],
    // schema: friendsSchema,
    handler: async (request, reply) => {
      return await controllers.getLeaders(request, reply);
    },
  });

  fastify.route({
    method: "GET",
    url: "/friends",
    preHandler: [authorize],
    schema: friendsSchema,
    handler: async (request, reply) => {
      return await controllers.userFriends(request, reply);
    },
  });

  fastify.route({
    method: "POST",
    url: "/boost",
    preHandler: [authorize],
    schema: upgradeSchema,
    handler: async (request, reply) => {
      return await controllers.userBoost(request, reply);
    },
  });
  fastify.route({
    method: "POST",
    url: "/upgrade",
    preHandler: [authorize],
    schema: upgradeSchema,
    handler: async (request, reply) => {
      return await controllers.userUpgrade(request, reply);
    },
  });
}

export default botRouter;
