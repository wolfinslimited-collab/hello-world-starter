import * as dotenv from "dotenv";
dotenv.config({});
import fastify from "fastify";
import routes from "./routes";
import * as redis from "./helpers/redis";

import data from "./data";
const PORT = Number(process.env.DEX_API_PORT) || 5000;

(BigInt.prototype as any).toJSON = function () {
  const int = Number.parseInt(this.toString());
  return int ?? this.toString();
};

const startServer = async () => {
  const app = fastify({});

  app.register(require("@fastify/formbody"));
  app.register(require("@fastify/cors"), {
    origin: "*",
  });
  app.register(require("@fastify/helmet"), {
    global: false,
  });

  routes(app);
  app.setErrorHandler((error, request, reply) => {
    reply.send(error);
  });
  //test
  await redis.initRedis();
  // await redis.cleanDB();

  app.listen({ port: PORT });
  console.log(`Server listening on port ${PORT}`);

  await data();
};

startServer();
