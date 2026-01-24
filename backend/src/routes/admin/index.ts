import { FastifyInstance } from "fastify";
import usersRouter from "./user.router";
import aiChatRouter from "./aiChat.router";

// new routes
import adminAssetRoutes from "./asset.router";
import adminFinancialRoutes from "./financial.router";
import adminStatesRoutes from "./stats.router";

async function adminRouter(fastify: FastifyInstance) {
  fastify.register(usersRouter, { prefix: "/users" });
  fastify.register(aiChatRouter, { prefix: "/aiCaht" });

  // new
  fastify.register(adminAssetRoutes, { prefix: "/assets" });
  fastify.register(adminStatesRoutes, { prefix: "/stats" });
  fastify.register(adminFinancialRoutes, { prefix: "/financial" });
}
export default adminRouter;
