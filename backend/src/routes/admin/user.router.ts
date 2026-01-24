import { FastifyInstance } from "fastify";
import {
  listUsers,
  getUserProfile,
  getStats,
} from "../../controllers/admin/users.controller";

async function adminRoutes(fastify: FastifyInstance) {
  // Get paginated users list
  // Example: GET /admin/users?page=1&limit=20
  fastify.get("/", listUsers);

  // Get full user profile (Orders, Positions, Wallets, Referrals, etc.)
  // Example: GET /admin/users/5
  fastify.get("/:userId", getUserProfile);

  // Example: GET /admin/stats
  fastify.get("/:userId/stats", getStats);
}

export default adminRoutes;
