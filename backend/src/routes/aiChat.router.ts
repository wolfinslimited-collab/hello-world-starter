import { FastifyInstance } from "fastify";
import aiChatController from "../controllers/aiChat.controller";
import ClientAIChatSchema from "../schema/aiChat.schema";
import { optionalAuthenticate } from "../middlewares/optionalAuthenticate";

async function aiChatRouter(fastify: FastifyInstance) {
  fastify.route({
    method: "GET",
    url: "/conversations",
    preHandler: [optionalAuthenticate],
    schema: ClientAIChatSchema.conversationList,
    handler: aiChatController.conversationList,
  });
  fastify.route({
    method: "GET",
    url: "/endchat",
    preHandler: [optionalAuthenticate],
    schema: ClientAIChatSchema.conversationEnd,
    handler: aiChatController.conversationEnd,
  });

  fastify.route({
    method: "GET",
    url: "/messages/:conversationId",
    preHandler: [optionalAuthenticate],
    schema: ClientAIChatSchema.messageList,
    handler: aiChatController.messageList,
  });

  fastify.route({
    method: "POST",
    url: "/send",
    preHandler: [optionalAuthenticate],
    schema: ClientAIChatSchema.sendMessage,
    handler: aiChatController.sendMessage,
  });

  fastify.route({
    method: "GET",
    url: "/mode/:conversationId",
    preHandler: [optionalAuthenticate],
    schema: ClientAIChatSchema.aiMode,
    handler: aiChatController.aiToggle,
  });

  fastify.route({
    method: "POST",
    url: "/feedback/:messageId",
    preHandler: [optionalAuthenticate],
    schema: ClientAIChatSchema.feedBack,
    handler: aiChatController.feedback,
  });

  fastify.route({
    method: "GET",
    url: "/marketing/:cid",
    handler: aiChatController.marketing,
  });
}

export default aiChatRouter;
