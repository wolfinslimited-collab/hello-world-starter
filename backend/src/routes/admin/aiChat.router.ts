import { FastifyInstance } from "fastify";
import adminAIChatController from "../../controllers/admin/aiChat.controller";

async function adminAIChatRouter(fastify: FastifyInstance) {
  // GET /admin/conversations?page=1&limit=20
  fastify.route({
    method: "GET",
    url: "/conversations",
    handler: adminAIChatController.conversationList,
  });

  // GET /admin/conversation/:conversationId
  fastify.route({
    method: "GET",
    url: "/conversation/:conversationId",
    handler: adminAIChatController.conversationGet,
  });

  // GET /admin/conversation/:conversationId/chat?page=1&limit=50
  fastify.route({
    method: "GET",
    url: "/conversation/:conversationId/chat",
    handler: adminAIChatController.conversationChatList,
  });

  // POST /admin/conversation/:conversationId/end
  fastify.route({
    method: "POST",
    url: "/conversation/:conversationId/end",
    handler: adminAIChatController.conversationEndById,
  });

  // POST /admin/conversation/:conversationId/message
  // body: { text: string, fromRole?: "admin" | "ai" | "system" }
  fastify.route({
    method: "POST",
    url: "/conversation/:conversationId/message",
    handler: adminAIChatController.sendMessageToUser,
  });

  fastify.route({
    method: "GET",
    url: "/mode/:conversationId",
    handler: adminAIChatController.aiToggle,
  });
}

export default adminAIChatRouter;
