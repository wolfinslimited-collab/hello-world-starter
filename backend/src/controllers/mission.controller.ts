import { FastifyReply } from "fastify";
import { MissionService } from "../services/mission.service";
import { error, success } from "../helpers/reply";

const service = new MissionService();

export const getMissionList = async (request: any, reply: FastifyReply) => {
  try {
    const missions = await service.listMissions();

    success(reply, {
      missions,
    });
  } catch (err) {
    console.error("get airdrops error:", err);
    error(reply, "ERROR500", err);
  }
};
export const getUserMissions = async (request: any, reply: FastifyReply) => {
  try {
    const { user } = request;

    const userMissions = await service.userMissions(user.id);

    success(reply, {
      userMissions,
    });
  } catch (err) {
    console.error("get airdrops error:", err);
    error(reply, "ERROR500", err);
  }
};
export const getMissionRewards = async (request: any, reply: FastifyReply) => {
  try {
    const { user } = request;
    const { missionId } = request.body;

    const tokens = await service.getMissionReward(user.id, missionId);
    const userMissions = await service.userMissions(user.id);

    success(reply, { tokens, userMissions });
  } catch (err) {
    console.error("get airdrops error:", err);
    error(reply, "ERROR500", err);
  }
};
