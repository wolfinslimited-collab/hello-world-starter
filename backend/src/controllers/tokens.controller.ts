import { FastifyReply } from "fastify";
import { AirdropService } from "../services/airdrop-tokens";
import { error, success } from "../helpers/reply";

const service = new AirdropService();

export const getActiveAirdrops = async (request: any, reply: FastifyReply) => {
  try {
    const tokens = await service.getTokens();

    success(reply, {
      tokens,
      count: tokens.length,
    });
  } catch (err) {
    console.error("get airdrops error:", err);
    error(reply, "ERROR500", err);
  }
};

export const claimInitialAirdrops = async (
  request: any,
  reply: FastifyReply
) => {
  try {
    const { user } = request;
    const result = await service.claimAllInitialTokens(user.id);

    success(reply, result);
  } catch (err) {
    console.error("claim initial error:", err);
    // You might want to differentiate 400 vs 500 here, but keeping your style:
    error(reply, "ERROR500", err);
  }
};

export const claimDailyRewards = async (request: any, reply: FastifyReply) => {
  try {
    const { user } = request;
    const appliedMultiplier = user.level || 1;

    const result = await service.claimAllDailyTokens(
      user.id,
      appliedMultiplier
    );

    success(reply, result);
  } catch (err) {
    console.error("claim daily error:", err);
    error(reply, "ERROR500", err);
  }
};
export const claimDailyToken = async (request: any, reply: FastifyReply) => {
  try {
    const { user } = request;
    const { tokenId } = request.body;
    const appliedMultiplier = user.level || 1;

    const result = await service.claimDailyToken(
      user.id,
      Number(tokenId),
      appliedMultiplier
    );

    success(reply, result);
  } catch (err) {
    console.error("claim daily error:", err);
    error(reply, "ERROR500", err);
  }
};
