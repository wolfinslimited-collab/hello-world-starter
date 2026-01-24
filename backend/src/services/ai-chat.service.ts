import { PrismaClient } from "@prisma/client";
import { generateResponse } from "./ai-gemini.service";
import { getIpInfo } from "./ip.service";
const prisma = new PrismaClient();

type GetConversationChatParams = {
  conversationId: number;
  page?: number;
  limit?: number;
  source?: "WEB" | "TELEGRAM";
  status?: "open" | "closed" | "all";
};

class AIChatService {
  async getConversations(uid: string, page: number, limit: number) {
    try {
      return await prisma.conversation.findMany({
        where: { uid, endedAt: null },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" }, // last message preview
          },
        },
      });
    } catch (err) {
      console.error("[AIChatService.getConversations] Error:", err);
      throw err;
    }
  }

  async endConversations(uid: string) {
    try {
      await prisma.conversation.updateMany({
        where: { uid },
        data: { endedAt: new Date() },
      });
    } catch (err) {
      console.error("[AIChatService.endConversations] Error:", err);
      throw err;
    }
  }

  async toggleAiMode(conversationId: number) {
    // fetch current value
    const convo = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { aiMode: true },
    });
    if (!convo) throw new Error("Conversation not found");

    // flip value
    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: { aiMode: !convo.aiMode },
    });

    return updated;
  }

  async addFeedbackToMessage(messageId: number, feedback: 1 | 2 | boolean) {
    let value: number;
    if (feedback === true) value = 1;
    else if (feedback === false) value = 2;
    else value = feedback;
    const msg = await prisma.chatMessage.update({
      where: { id: messageId },
      data: { feedback: value },
    });
    return msg;
  }

  async getMessages(
    uid: string,
    conversationId: number,
    page: number,
    limit: number
  ) {
    try {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { userRead: true },
      });
      const conv = await prisma.conversation.findFirst({
        where: { id: conversationId, uid },
      });
      if (!conv) throw new Error("Conversation not found");

      return await prisma.chatMessage.findMany({
        where: { cId: conversationId },
        orderBy: { createdAt: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      });
    } catch (err) {
      console.error("[AIChatService.getMessages] Error:", err);
      throw err;
    }
  }

  async sendMessage(
    uid: string,
    conversationId: number | undefined,
    text: string,
    data: any
  ) {
    try {
      let conversation;
      if (conversationId) {
        conversation = await prisma.conversation.findFirst({
          where: { id: conversationId, uid },
        });
        if (!conversation) throw new Error("Conversation not found");
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });
      } else {
        let info: any = {};
        let meta: any = {};
        if (data?.ip) {
          info = await getIpInfo(data?.ip);
        }
        if (data?.currentUrl) {
          meta.currentUrl = data?.currentUrl;
        }
        conversation = await prisma.conversation.create({
          data: {
            uid,
            email: data?.email,
            telegramId: data?.telegramId,
            source: data.source,
            info,
            meta,
          },
        });
      }

      if (conversation.aiMode) {
        const res = await generateResponse(
          conversation.id,
          uid,
          text,
          data?.image
        );
        await prisma.chatMessage.create({
          data: {
            cId: conversation.id,
            uid,
            from: "user",
            text,
            meta: { ...(data?.image ? { image: data?.image } : {}) },
          },
        });
        const aiReply = await prisma.chatMessage.create({
          data: {
            cId: conversation.id,
            uid,
            from: "ai",
            text: res,
          },
        });
        return { conversation, messages: aiReply };
      } else {
        await prisma.chatMessage.create({
          data: {
            cId: conversation.id,
            uid,
            from: "user",
            text,
            meta: { ...(data?.image ? { image: data?.image } : {}) },
          },
        });
        return { conversation, messages: "manual" };
      }
    } catch (err) {
      console.error("[AIChatService.sendMessage] Error:", err);
      throw err;
    }
  }

  // Fetch a conversation by id (admin - no uid restriction)
  async getConversation(conversationId: number) {
    try {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { adminRead: true },
      });
      const conv = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });
      if (!conv) throw new Error("Conversation not found");
      return conv;
    } catch (err) {
      console.error("[AIChatService.getConversation] Error:", err);
      throw err;
    }
  }

  async getConversationChat(params: GetConversationChatParams) {
    const { conversationId, page = 1, limit = 100 } = params;
    const conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: { adminRead: true },
    });
    try {
      const conversationWhere: any = { id: conversationId };

      const conv = await prisma.conversation.findFirst({
        where: conversationWhere,
        select: { id: true, source: true, endedAt: true },
      });

      if (!conv) {
        const msg = `Conversation not found or doesn't match provided filters (id=${conversationId}).`;
        const e: any = new Error(msg);
        e.code = "NOT_FOUND_OR_FILTER_MISMATCH";
        throw e;
      }

      // Now fetch messages for that conversation with pagination
      const whereMessages = { cId: conversationId };

      const [items, total] = await Promise.all([
        prisma.chatMessage.findMany({
          where: whereMessages,
          orderBy: { createdAt: "asc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.chatMessage.count({ where: whereMessages }),
      ]);

      return {
        items,
        total,
        conversation,
      };
    } catch (err) {
      console.error("[AIChatService.getConversationChat] Error:", err);
      // Bubble up with meaningful message
      throw err;
    }
  }

  // End a conversation by id (admin)
  async endConversation(conversationId: number) {
    try {
      const conv = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });
      if (!conv) throw new Error("Conversation not found");

      return await prisma.conversation.update({
        where: { id: conversationId },
        data: { endedAt: new Date() },
      });
    } catch (err) {
      console.error("[AIChatService.endConversation] Error:", err);
      throw err;
    }
  }

  async sendMessageToUserInConversation(
    conversationId: number,
    text: string,
    fromRole: "admin" | "ai" | "system" = "admin",
    image?: string
  ) {
    try {
      const conv = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });
      if (!conv) throw new Error("Conversation not found");

      await prisma.conversation.update({
        where: { id: conversationId },
        data: { userRead: false },
      });
      const msg = await prisma.chatMessage.create({
        data: {
          cId: conversationId,
          uid: conv.uid ?? null,
          from: fromRole,
          text,
          meta: { ...(image ? { image: image } : {}) },
        },
      });

      return msg;
    } catch (err) {
      console.error(
        "[AIChatService.sendMessageToUserInConversation] Error:",
        err
      );
      throw err;
    }
  }

  // user asked: "get convertion" (alias)
  async getConvertion(conversationId: number) {
    return this.getConversation(conversationId);
  }

  // user asked: "endConvertion" (alias)
  async endConvertion(conversationId: number) {
    return this.endConversation(conversationId);
  }

  // user asked: "send message to user in convertion" (alias)
  async sendMessageToUserInConvertion(
    conversationId: number,
    text: string,
    fromRole: "admin" | "ai" | "system" = "admin"
  ) {
    return this.sendMessageToUserInConversation(conversationId, text, fromRole);
  }
}

export default new AIChatService();
