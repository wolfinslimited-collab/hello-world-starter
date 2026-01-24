import userRouter from "./user.router";
import fileRouter from "./file.router";
import walletRouter from "./wallet.router";
import missionsRouter from "./mission.router";
import tokensRouter from "./tokens.router";
import tradeRouter from "./trade.router";
import aiChatRouter from "./aiChat.router";
import adminRouter from "./admin";

import { FastifyInstance } from "fastify";

const routes = (server: FastifyInstance) => {
  server.get("/", (request, reply) => {
    reply.send({ name: "fastify-typescript" });
  });
  server.register(userRouter, { prefix: "/user" });
  server.register(fileRouter, { prefix: "/file" });
  server.register(walletRouter, { prefix: "/wallet" });
  server.register(missionsRouter, { prefix: "/missions" });
  server.register(tokensRouter, { prefix: "/tokens" });
  server.register(tradeRouter, { prefix: "/trade" });
  server.register(adminRouter, { prefix: "/admin" });
  server.register(aiChatRouter, { prefix: "/ai" });
};

export default routes;
