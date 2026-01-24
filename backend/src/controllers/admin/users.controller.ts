import { FastifyReply, FastifyRequest } from "fastify";
import { AdminService } from "../../services/admin.service";
import { error, success } from "../../helpers/reply";

const service = new AdminService();

/**
 * Get paginated list of all users with social links and activity counts
 */
export const listUsers = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { page, limit } = request.query as { page?: string; limit?: string };

    const pageNum = parseInt(page || "1");
    const limitNum = parseInt(limit || "20");

    const result = await service.getUserList(pageNum, limitNum);

    success(reply, {
      users: result.data,
      meta: result.meta,
    });
  } catch (err) {
    console.error("Admin List Users Error:", err);
    error(reply, "ERROR500", err);
  }
};

/**
 * Get full depth details for a specific user (Wallets, Orders, Positions, etc.)
 */
export const getUserProfile = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { userId } = request.params as { userId: string };
    const id = parseInt(userId);

    const profile = await service.getUserFullDetails(id);

    if (!profile) {
      return error(reply, "USER_NOT_FOUND", "User does not exist");
    }

    success(reply, { profile });
  } catch (err) {
    console.error("Admin Get Profile Error:", err);
    error(reply, "ERROR500", err);
  }
};

/**
 * Get aggregated financial status (Total Deposits, Withdrawals, Airdrops)
 */
export const getStats = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const stats = await service.getStatusSummary();

    success(reply, { stats });
  } catch (err) {
    console.error("Admin Get Stats Error:", err);
    error(reply, "ERROR500", err);
  }
};

/**
 * Admin action to change user status (Active/Inactive/Pending)
 */
export const updateUserStatus = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { userId } = request.params as { userId: string };
    const { status } = request.body as {
      status: "Active" | "Inactive" | "Pending";
    };

    const id = parseInt(userId);
    const updatedUser = await service.updateUserStatus(id, status);

    success(reply, { user: updatedUser });
  } catch (err) {
    console.error("Admin Update Status Error:", err);
    error(reply, "ERROR500", err);
  }
};
