import { FastifyReply } from "fastify";
import { error, success } from "../helpers/reply";
import * as walletService from "../services/wallet.service";

export const assets = async (request: any, reply: FastifyReply) => {
  try {
    const data = await walletService.getAssets();
    success(reply, data);
  } catch (err) {
    console.log(err);
    error(reply, "ERROR500", err);
  }
};

export const userWallet = async (request: any, reply: FastifyReply) => {
  try {
    const userId = request.user.id;
    const data = await walletService.getUserWallets(userId);
    success(reply, data);
  } catch (err) {
    console.log(err);
    error(reply, "ERROR500", err);
  }
};

export const deposit = async (request: any, reply: FastifyReply) => {
  try {
    const userId = request.user.id;
    const body = request.body;

    const result = await walletService.submitDeposit(userId, body);

    if (!result.success) {
      return error(reply, "BAD_REQUEST", result.error);
    }
    success(reply, result.transaction);
  } catch (err) {
    console.log(err);
    error(reply, "ERROR500", err);
  }
};

export const withdraw = async (request: any, reply: FastifyReply) => {
  try {
    const userId = request.user.id;
    const body = request.body;

    const result = await walletService.requestWithdraw(userId, body);

    if (!result.success) {
      return error(reply, "BAD_REQUEST", result.error);
    }
    success(reply, result);
  } catch (err) {
    console.log(err);
    error(reply, "ERROR500", err);
  }
};
