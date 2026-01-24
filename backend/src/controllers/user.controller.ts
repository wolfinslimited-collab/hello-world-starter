import { FastifyReply } from "fastify";
import { error, success } from "../helpers/reply";
import crypto from "crypto";
import { setStringWithTTL } from "../helpers/redis";
import prisma from "../helpers/prisma";
import {
  findOrCreateUser,
  getAllLeaderboards,
  getFriends,
  linkWallet,
} from "../services/user.service";
import { UserStatusType } from "@prisma/client";
import { AirdropService } from "../services/airdrop-tokens";
import { modifyWallet } from "../services/wallet.service";
import { math } from "../helpers/mathUtils";

const airdropService = new AirdropService();

export const userAuth = async (request: any, reply: FastifyReply) => {
  try {
    const { chain, address, signature, refId } = request.body;

    const { user, isNewUser } = await findOrCreateUser({
      chain,
      address,
      signature,
      referId: refId,
    });
    if (!user) {
      return error(reply, "ERROR401", "Authentication failed");
    }
    const userId = user.id;

    const appToken = crypto
      .createHmac("sha256", process.env.SECRET_SALT || "DEX_DEFAULT_SECRET")
      .update(`${userId}`)
      .digest("hex");
    await setStringWithTTL(`dex_auth_${appToken}`, String(userId));
    return success(reply, {
      token: appToken,
      userId,
      isNewUser,
    });
  } catch (err) {
    console.error("Login error:", err);
    return error(reply, "ERROR401", "Authentication failed");
  }
};

export const userUpdate = async (request, reply: FastifyReply) => {
  try {
    const { user } = request;
    const { fullName } = request.body;
    let xuser = user;
    if (fullName) {
      xuser = await prisma.user.update({
        where: { id: user.id },
        data: { fullName },
      });
    }

    success(reply, {
      user: xuser,
    });
  } catch (err) {
    console.error("profile error:", err);

    error(reply, "ERROR500", err);
  }
};

export const userProfile = async (request, reply: FastifyReply) => {
  try {
    const { user } = request;
    const tokens = await airdropService.getUserTokens(user.id);

    success(reply, {
      user,
      tokens,
    });
  } catch (err) {
    console.error("profile error:", err);

    error(reply, "ERROR500", err);
  }
};
export const userLink = async (request: any, reply: FastifyReply) => {
  try {
    const { user } = request;
    const { chain, address, signature } = request.body;
    await linkWallet(user.id, { chain, address, signature });

    success(reply, {
      ok: true,
    });
  } catch (err) {
    console.error("profile error:", err);
    error(reply, "ERROR500", err);
  }
};
export const userActive = async (request, reply: FastifyReply) => {
  try {
    const { user } = request;
    const { walletId } = request.body;
    const amount = 3;
    const finalAmount = await getCalc(user.id, walletId, amount);
    if (finalAmount == 0) {
      return error(reply, "ERROR400", "No balance!");
    }
    await modifyWallet(user.id, -finalAmount, { walletId });
    const xuser = await prisma.user.update({
      where: { id: user.id },
      data: { status: UserStatusType.Active },
      include: { links: true },
    });
    await prisma.transaction.create({
      data: {
        userId: user.id,
        amount: finalAmount,
        type: "Out",
        tag: "Activate",
      },
    });
    await airdropService.claimAllInitialTokens(user.id);
    const tokens = await airdropService.getUserTokens(user.id);

    success(reply, {
      user: xuser,
      tokens,
    });
  } catch (err) {
    console.log({ err });
    error(reply, "ERROR500", err);
  }
};
export const userUpgrade = async (request, reply: FastifyReply) => {
  try {
    const { user } = request;
    const { walletId } = request.body;
    const amount = (user?.level + 1) * 3;

    const finalAmount = await getCalc(user.id, walletId, amount);
    console.log({ finalAmount });
    if (finalAmount == 0) {
      return error(reply, "ERROR400", "No balance!");
    }
    await modifyWallet(user.id, -finalAmount, { walletId });

    const xuser = await prisma.user.update({
      where: { id: user.id },
      data: { level: { increment: 1 } },
      include: { links: true },
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        amount: finalAmount,
        type: "Out",
        tag: "Activate",
      },
    });

    success(reply, {
      user: xuser,
    });
  } catch (err) {
    console.log({ err });
    error(reply, "ERROR500", err);
  }
};

export const userBoost = async (request, reply: FastifyReply) => {
  try {
    const { user } = request;
    const { walletId } = request.body;
    const amount = (user?.boost + 1) * 10;

    const finalAmount = await getCalc(user.id, walletId, amount);
    if (finalAmount == 0) {
      return error(reply, "ERROR400", "No balance!");
    }
    await modifyWallet(user.id, -finalAmount, { walletId });

    const xuser = await prisma.user.update({
      where: { id: user.id },
      data: { boost: { increment: 1 } },
      include: { links: true },
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        amount: finalAmount,
        type: "Out",
        tag: "Activate",
      },
    });
    await airdropService.multiplyBalances(user.id);
    const tokens = await airdropService.getUserTokens(user.id);

    success(reply, {
      user: xuser,
      tokens,
    });
  } catch (err) {
    console.log({ err });
    error(reply, "ERROR500", err);
  }
};

export const userFriends = async (request, reply: FastifyReply) => {
  try {
    const { user } = request;
    const data = await getFriends(request.query, user.id);

    success(reply, data);
  } catch (err) {
    console.log({ err });
    error(reply, "ERROR500", err);
  }
};
export const getLeaders = async (request, reply: FastifyReply) => {
  try {
    const leaders = await getAllLeaderboards();

    success(reply, { leaders });
  } catch (err) {
    console.log({ err });
    error(reply, "ERROR500", err);
  }
};

const getCalc = async (userId, walletId: number, amount: number) => {
  const wallet = await prisma.wallet.findFirst({
    where: { id: walletId, userId },
    include: { asset: true },
  });
  if (!wallet) return 0;
  const price = math.div(amount, wallet.asset.price);
  return wallet.balance >= price ? math.round(price, 4) : 0;
};
