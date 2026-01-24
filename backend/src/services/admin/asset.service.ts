import prisma from "../../helpers/prisma";

export class AssetService {
  async getAssetsList(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        skip,
        take: limit,
        include: {
          networks: {
            include: {
              network: true,
            },
          },
        },
        orderBy: { id: "asc" },
      }),
      prisma.asset.count(),
    ]);

    return { assets, total };
  }

  async updateAssetNetwork(
    assetNetworkId: number,
    data: {
      isActive?: boolean;
      minDeposit?: number;
      canDeposit?: boolean;
      minWithdraw?: number;
      canWithdraw?: boolean;
      withdrawFee?: number;
    }
  ) {
    return await prisma.assetNetwork.update({
      where: { id: assetNetworkId },
      data,
    });
  }

  async updateAsset(
    assetId: number,
    data: {
      visible?: boolean;
      active?: boolean;
    }
  ) {
    
    return await prisma.asset.update({
      where: { id: assetId },
      data,
    });
  }
}
