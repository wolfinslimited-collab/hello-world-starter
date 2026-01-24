// services/generative.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "../helpers/prisma";
import fs from "fs";
import path from "path";

const API_KEY =
  process.env.TIMELESS_GEMINI_API_KEY ||
  "AIzaSyDxUN1sFqwhvpwt-bNRK1jpu2SaNRYjKV4";

const INDEX_MD_PATH = path.join(__dirname, "../data/ai/index.md");

async function fetchImageDataUri(
  imageUrl: string
): Promise<{ dataUri: string; mime: string } | null> {
  if (!imageUrl) return null;
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) {
      console.warn(
        `Failed to download image. URL: ${imageUrl} - status: ${res.status}`
      );
      return null;
    }
    const contentType =
      res.headers.get("content-type") || "application/octet-stream";

    // Optional safety: refuse extremely large images to avoid huge prompts
    const contentLengthHeader = res.headers.get("content-length");
    if (contentLengthHeader) {
      const contentLength = Number(contentLengthHeader);
      // 5 MB limit for prompt embedding (adjust as needed)
      if (!Number.isNaN(contentLength) && contentLength > 5 * 1024 * 1024) {
        console.warn(
          `Image appears too large (${contentLength} bytes). Skipping embedding.`
        );
        return null;
      }
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const dataUri = `data:${contentType};base64,${base64}`;
    return { dataUri, mime: contentType };
  } catch (err) {
    console.error("fetchImageDataUri error:", err);
    return null;
  }
}

const DEFAULT_PROMPT_HEADER = (content: string) => `
${content}
Use the following conversation history to understand context before answering.
`;

/**
 * generateResponse
 *
 * @param uid string user id (keeps your short-uid conditional logic)
 * @param userQuestion string the user's question
 * @param conversations string conversation history (already formatted)
 * @param image string optional remote image URL (always treated as URL)
 * @returns generated markdown string or undefined on failure
 */
export const generateResponse = async (
  cId: number,
  uid: string,
  userQuestion: string,
  image?: string
): Promise<string | undefined> => {
  if (!API_KEY) {
    console.error(
      "GOOGLE_API_KEY_AI environment variable is not set (and no fallback provided)."
    );
    return;
  }

  // Read index.md content (best-effort; continue if missing)
  let content = "";
  try {
    content = fs.readFileSync(INDEX_MD_PATH, "utf8");
  } catch (err) {
    console.warn(
      `Could not read ${INDEX_MD_PATH}. Continuing with empty content. Error:`,
      err
    );
    content = "";
  }

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
  });

  let prompt = DEFAULT_PROMPT_HEADER(content);
  const convertion = await prisma.conversation.findUnique({
    where: { id: cId },
  });
  // Attach user-specific context when uid is short (keeps your original behavior)
  try {
    if (uid && uid.length < 10) {
      const userDataJson = await getUserData(Number(uid), convertion);
      prompt += `\nUser-specific context — use this data to personalize answers and reference the user's profile, portfolio, and preferences where relevant.\n${userDataJson}\n`;
    } else if (convertion.telegramId) {
      const data = { user: { name: convertion.email } };
      prompt += `\nUser-specific context — use this data to personalize answers and reference the user's profile where relevant.\n${data}\n`;
    }
  } catch (err) {
    console.warn(
      "getUserData failed or uid not numeric; continuing without user data.",
      err
    );
  }

  // If an image URL is provided, fetch it and embed as data URI in the prompt
  if (image) {
    const imageData = await fetchImageDataUri(image);
    if (imageData) {
      prompt += `\n\n## ATTACHED IMAGE\nThe user attached an image (remote URL). The assistant may analyze and reference it where relevant.\n`;
      prompt += `IMAGE_DATA_URI: ${imageData.dataUri}\n`;
      prompt += `IMAGE_MIME_TYPE: ${imageData.mime}\n\n`;
      // NOTE: prefer sending image as a multimodal input when SDK supports it;
      // embedding a data URI in the prompt is a fallback approach.
    } else {
      prompt += `\n\n## ATTACHED IMAGE\nThe user provided an image URL but it couldn't be downloaded or was too large. Proceed without the image.\n\n`;
    }
  }

  const history = await prisma.chatMessage.findMany({
    where: { cId },
  });
  const conversations = history
    .map((msg) => `${msg.from}: ${msg.text}`)
    .join("\n");

  prompt += `\n## **CONVERSATION HISTORY**\n${conversations}\n\n`;
  prompt += `\n## **USER QUERY**\n${userQuestion}\n\n`;

  // Instruct output format
  prompt += `\nPlease answer in clear Markdown. When referring to data from the user's profile or attached image, explicitly label where you used those sources.\n`;

  try {
    // Keep the same call shape your earlier code used (if your SDK expects a different shape,
    const result = await model.generateContent(prompt);
    const response = result.response;
    // Many SDKs expose .text() to get the generated text; if your version differs, adapt accordingly.
    const markdownText =
      typeof response.text === "function" ? response.text() : String(response);
    return markdownText;
  } catch (error) {
    console.error("Error generating content:", error);
    return "Please hold on — our support team will get back to you soon.";
  }
};

const getUserData = async (id: number, convertion: any) => {
  // const user = await prisma.user.findUnique({
  //   where: { id },
  //   include: { wallets: true, betHistories: true, transaction: true },
  // });

  return JSON.stringify({ convertion });
};
