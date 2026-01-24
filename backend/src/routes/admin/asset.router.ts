import { FastifyInstance } from "fastify";
import {
  assetsList,
  updateAsset,
  updateAssetNetwork,
} from "../../controllers/admin/asset.controller";
import {
  updateAssetNetworkSchema,
  updateAssetSchema,
} from "../../schema/asset.schema";

async function adminAssetRoutes(fastify: FastifyInstance) {
  fastify.get("/", assetsList);
  fastify.put("/update-asset/:id", { schema: updateAssetSchema }, updateAsset);
  fastify.put("/update-network/:id", { schema: updateAssetNetworkSchema }, updateAssetNetwork);
}

export default adminAssetRoutes;
