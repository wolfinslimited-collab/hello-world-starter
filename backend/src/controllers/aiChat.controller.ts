import { FastifyReply } from "fastify";
import aiChatService from "../services/ai-chat.service";
import { success, error } from "../helpers/reply";
import { ConversationSource } from "@prisma/client";

class AIChatController {
  async conversationList(req, reply: FastifyReply) {
    try {
      const { page, limit } = req.query as { page: number; limit: number };
      const uid = getUid(req);
      const data = await aiChatService.getConversations(uid, page, limit);
      success(reply, data);
    } catch (err) {
      console.log({ err });
      error(reply, "ERROR500", err);
    }
  }

  async conversationEnd(req, reply: FastifyReply) {
    try {
      const uid = getUid(req);
      const data = await aiChatService.endConversations(uid);
      success(reply, data);
    } catch (err) {
      console.log({ err });
      error(reply, "ERROR500", err);
    }
  }

  async messageList(req, reply: FastifyReply) {
    try {
      const { conversationId } = req.params as { conversationId: number };
      const { page, limit } = req.query as { page: number; limit: number };
      const uid = getUid(req);
      const data = await aiChatService.getMessages(
        uid,
        conversationId,
        page,
        limit
      );
      success(reply, data);
    } catch (err) {
      console.log({ err });
      error(reply, "ERROR500", err);
    }
  }

  async sendMessage(req, reply: FastifyReply) {
    try {
      const { cId, text, email, image, currentUrl } = req.body;
      const { clientIP } = req;
      const uid = getUid(req);
      const data = await aiChatService.sendMessage(uid, cId, text, {
        email,
        image,
        ip: clientIP,
        currentUrl,
        source: ConversationSource.WEB,
      });
      success(reply, data);
    } catch (err) {
      console.log({ err });
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

  async feedback(req, reply: FastifyReply) {
    try {
      const { messageId } = req.params as { messageId: number };
      const { feedback } = req.body as { feedback: "good" | "bad" };
      const data = await aiChatService.addFeedbackToMessage(
        Number(messageId),
        feedback === "good"
      );
      success(reply, data);
    } catch (err) {
      console.log({ err });
      error(reply, "ERROR500", err);
    }
  }
  async marketing(req, reply: FastifyReply) {
    try {
      const { cid } = req.params as { cid: number };
      // const msg = await generateAndSaveMarketingMessage(Number(cid));
      success(reply, true);
    } catch (err) {
      console.log({ err });
      error(reply, "ERROR500", err);
    }
  }
}

function getUid(request) {
  if (request.user?.id) return String(request.user.id);
  const guestId = request.query?.uid || request.body?.uid;
  if (!guestId) throw new Error("Guest ID is required for guest users");
  return String(guestId);
}

export default new AIChatController();
