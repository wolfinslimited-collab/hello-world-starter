import { FastifyReply, FastifyRequest } from "fastify";
import aiChatService from "../../services/ai-chat.service";
import { success, error } from "../../helpers/reply";
import prisma from "../../helpers/prisma";

type QPageLimit = { page?: string | number; limit?: string | number };
type QPageLimitFilters = {
  page?: string;
  limit?: string;
  source?: string; // expected 'WEB' | 'TELEGRAM'
  status?: string; // expected 'open' | 'closed' | 'all'
};
class AdminAIChatController {
  async conversationList(
    req: FastifyRequest<{ Querystring: QPageLimitFilters }>,
    reply: FastifyReply
  ) {
    try {
      const page = Math.max(1, Number(req.query?.page ?? 1));
      const limit = Math.max(1, Math.min(100, Number(req.query?.limit ?? 20)));
      const skip = (page - 1) * limit;

      // Parse & validate source
      const rawSource = (req.query?.source ?? "").toUpperCase();
      const sourceFilter =
        rawSource === "WEB" || rawSource === "TELEGRAM" ? rawSource : undefined;

      // Parse & normalize status
      const rawStatus = (req.query?.status ?? "").toLowerCase();
      let statusFilter: "open" | "closed" | "all" | undefined;
      if (
        rawStatus === "open" ||
        rawStatus === "closed" ||
        rawStatus === "all"
      ) {
        statusFilter = rawStatus;
      }

      // Build Prisma where clause
      const where: any = {};
      if (sourceFilter) {
        where.source = sourceFilter; // Prisma enum values: WEB | TELEGRAM
      }
      if (statusFilter && statusFilter !== "all") {
        if (statusFilter === "open") where.endedAt = null;
        if (statusFilter === "closed") where.endedAt = { not: null };
      }

      const [total, conversations] = await Promise.all([
        prisma.conversation.count({ where }),
        prisma.conversation.findMany({
          where,
          orderBy: { updatedAt: "desc" },
          skip,
          take: limit,
          include: {
            messages: {
              take: 1,
              orderBy: { createdAt: "desc" },
              select: {
                id: true,
                text: true,
                from: true,
                createdAt: true,
              },
            },
          },
        }),
      ]);

      const items = await Promise.all(
        conversations.map(async (c) => {
          let userInfo: any = null;
          if (c.uid && c.uid.length < 10) {
            try {
              const userId = parseInt(String(c.uid).replace(/\D+/g, ""), 10);
              if (!isNaN(userId)) {
                userInfo = await prisma.user.findUnique({
                  where: { id: userId },
                });
              }
            } catch (err) {
              console.warn(`[conversationList] getUser(${c.uid}) failed:`, err);
            }
          }

          return {
            ...c,
            lastMessage: c.messages && c.messages.length ? c.messages[0] : null,
            userInfo,
            messages: undefined,
          };
        })
      );

      success(reply, { items, total, page, limit });
    } catch (err) {
      console.error("[AdminAIChatController.conversationList] Error:", err);
      error(reply, "ERROR500", err);
    }
  }
  async conversationGet(
    req: FastifyRequest<{ Params: { conversationId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const conversationId = Number(req.params.conversationId);
      if (!conversationId) throw new Error("Invalid conversationId");

      const data = await aiChatService.getConversation(conversationId);
      success(reply, data);
    } catch (err) {
      console.error("[AdminAIChatController.conversationGet] Error:", err);
      error(reply, "ERROR500", err);
    }
  }

  async conversationChatList(
    req: FastifyRequest<{
      Params: { conversationId: string };
      Querystring: QPageLimit;
    }>,
    reply: FastifyReply
  ) {
    try {
      const conversationId = Number(req.params.conversationId);
      if (!conversationId || Number.isNaN(conversationId)) {
        return error(reply, "INVALID_INPUT", "Invalid conversationId");
      }

      const page = Math.max(
        1,
        Number(req.query?.page ? Number(req.query.page) : 1)
      );
      const limit = Math.max(
        1,
        Math.min(500, Number(req.query?.limit ? Number(req.query.limit) : 50))
      );

      const result = await aiChatService.getConversationChat({
        conversationId,
        page,
        limit,
      });

      success(reply, {
        page,
        limit,
        total: result.total,
        hasMore: page * limit < result.total,
        items: result.items,
        conversation: result.conversation,
      });
    } catch (err) {
      console.error("[AdminAIChatController.conversationChatList] Error:", err);
      error(
        reply,
        "ERROR500",
        err instanceof Error ? err.message : String(err)
      );
    }
  }

  // POST /admin/conversation/:conversationId/end
  async conversationEndById(
    req: FastifyRequest<{ Params: { conversationId: string } }>,
    reply: FastifyReply
  ) {
    try {
      const conversationId = Number(req.params.conversationId);
      if (!conversationId) throw new Error("Invalid conversationId");

      const data = await aiChatService.endConversation(conversationId);
      success(reply, data);
    } catch (err) {
      console.error("[AdminAIChatController.conversationEndById] Error:", err);
      error(reply, "ERROR500", err);
    }
  }

  // POST /admin/conversation/:conversationId/message
  // body: { text: string, fromRole?: "admin" | "ai" | "system" }
  async sendMessageToUser(
    req: FastifyRequest<{
      Params: { conversationId: string };
      Body: {
        text: string;
        fromRole?: "admin" | "ai" | "system";
        image: string;
      };
    }>,
    reply: FastifyReply
  ) {
    try {
      const conversationId = Number(req.params.conversationId);
      if (!conversationId) throw new Error("Invalid conversationId");

      const { text, fromRole = "admin", image } = req.body;
      if (!text || typeof text !== "string" || text.trim().length === 0) {
        throw new Error("Text is required");
      }

      const data = await aiChatService.sendMessageToUserInConversation(
        conversationId,
        text,
        fromRole,
        image
      );
      success(reply, data);
    } catch (err) {
      console.error("[AdminAIChatController.sendMessageToUser] Error:", err);
      error(reply, "ERROR500", err);
    }
  }
  async aiToggle(req, reply: FastifyReply) {
    try {
      const { conversationId } = req.params as { conversationId: number };
      const data = await aiChatService.toggleAiMode(Number(conversationId));
      success(reply, data);
    } catch (err) {
      console.log({ err });
      error(reply, "ERROR500", err);
    }
  }
}

export default new AdminAIChatController();
