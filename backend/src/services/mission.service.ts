import prisma from "../helpers/prisma";
import { AirdropService } from "../services/airdrop-tokens";
const airdropService = new AirdropService();

export class MissionService {
  async listMissions() {
    return prisma.missions.findMany({
      where: { isActive: true },
      orderBy: {
        orderId: "asc",
      },
    });
  }

  async userMissions(userId: number) {
    const userMission = await prisma.userMission.findMany({
      where: { userId },
    });
    return userMission;
  }

  async getMissionReward(userId: number, missionId: number) {
    const mission = await prisma.missions.findUnique({
      where: { id: missionId },
    });

    if (!mission) throw new Error("Mission not found.");
    if (!mission.isActive)
      throw new Error("This mission is currently inactive.");

    const existingEntry = await prisma.userMission.findUnique({
      where: {
        task_user_unique: {
          userId,
          missionId,
        },
      },
    });

    if (existingEntry) {
      throw new Error("Mission already completed by this user.");
    }

    return prisma.$transaction(async (tx) => {
      await tx.userMission.create({
        data: {
          userId,
          missionId,
          reward: mission.rewardAmount,
        },
      });
      const tokens = await airdropService.addStaticAmount(
        userId,
        mission.rewardAmount
      );

      return tokens;
    });
  }
}
