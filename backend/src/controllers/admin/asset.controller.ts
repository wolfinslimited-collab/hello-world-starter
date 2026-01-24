import { FastifyReply, FastifyRequest } from "fastify";
import { AssetService } from "../../services/admin/asset.service";
import { error, success } from "../../helpers/reply";

const service = new AssetService();

export const assetsList = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { page, limit } = request.query as { page?: string; limit?: string };
    const pageNum = parseInt(page || "1");
    const limitNum = parseInt(limit || "20");

    const { assets, total } = await service.getAssetsList(pageNum, limitNum);

    success(reply, {
      assets,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    error(reply, "ERROR500", err);
  }
};

export const updateAssetNetwork = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const body = request.body as any;

    const updated = await service.updateAssetNetwork(parseInt(id), body);
    success(reply, { updated });
  } catch (err) {
    error(reply, "UPDATE_FAILED", err);
  }
};

export const updateAsset = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = request.params as { id: string };
    const body = request.body as any;

    const updated = await service.updateAsset(parseInt(id), body);
    success(reply, { updated });
  } catch (err) {
    error(reply, "UPDATE_FAILED", err);
  }
};