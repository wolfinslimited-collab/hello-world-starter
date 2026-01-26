import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Markdown from "./mardown";
import { get, json } from "utils/request";
import { Headset } from "lucide-react";
import Loading from "components/common/loading";
import useStorage from "context";

const Message = ({ conversion, message, isLast, setMessages }: any) => {
  const {
    setting: { token },
  } = useStorage();
  const [submitting, setSubmitting] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [localFeedback, setLocalFeedback] = useState<number | null>(
    message?.feedback ?? null
  );
  const [aiMode, setAiMode] = useState<boolean>(conversion?.aiMode);

  const handleFeedback = async (type: "good" | "bad") => {
    setError(null);
    setSubmitting(type);
    try {
      const res: any = await json(
        "ai/feedback/" + message?.id,
        { feedback: type },
        { ...(token ? { token } : {}) }
      );
      if (res?.success) {
        setLocalFeedback(type === "good" ? 1 : 2);
      }
    } catch (err: any) {
      setError("Failed to submit feedback. Try again.");
    } finally {
      setSubmitting("");
    }
  };

  const handleTransferToCS = async () => {
    setError(null);
    setSubmitting("cs");
    try {
      const res: any = await get(
        "ai/mode/" + conversion.id,
        token ? { token } : {}
      );
      setSubmitting("");

      if (res.success) {
        setAiMode((ai) => !ai);
        setMessages((m: any) => [...m, "manual"]);
      } else {
        setError(res?.data ?? "Transferred to customer service.");
      }
    } catch (err: any) {
      setError("Failed to transfer to customer service. Try again.");
      setSubmitting("");
    }
  };

  const FeedbackBadge = ({ fb }: { fb: number | null }) => {
    if (fb === 1)
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-900">
          <SolvedIcon />
          Solved
        </span>
      );
    if (fb === 2)
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-900">
          <UnsolvedIcon />
          Unsolved
        </span>
      );
    return null;
  };

  return (
    <AnimatePresence initial={false}>
      <motion.div
        initial={{
          x: message?.from === "user" ? 60 : -60,
          opacity: 0,
          rotate: message?.from === "user" ? 2 : -2,
          scale: 0.96,
        }}
        animate={{ x: 0, opacity: 1, rotate: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{
          type: "spring",
          stiffness: 700,
          damping: 28,
        }}
        className={`w-full my-3 flex   ${
          message?.from === "user" ? "justify-end " : "justify-start "
        }`}
      >
        {message == "manual" ? (
          <bdi
            className={`p-2 px-3 rounded-2xl text-neutral-600 text-sm ${
              message == "manual"
                ? "bg-green-500/5"
                : message?.from === "user"
                ? "bg-black/[4%] "
                : "bg-sky-500/5 "
            }`}
          >
            Support team will answer you shortly.
          </bdi>
        ) : (
          <div className="flex flex-col">
            <bdi
              className={`p-2 px-3 rounded-2xl text-neutral-600 text-sm ${
                message?.from === "user" ? "bg-black/[4%] " : "bg-sky-600/5 "
              }`}
            >
              {message?.meta?.image && (
                <img
                  src={message?.meta?.image}
                  className="rounded-xl w-full mb-4 max-w-fit"
                />
              )}
              <Markdown content={message?.text} />
            </bdi>
            {message?.from !== "user" && (
              <>
                <div className={`mt-2 w-full flex items-center gap-2`}>
                  {isLast && localFeedback === null ? (
                    <>
                      <button
                        onClick={() => handleFeedback("good")}
                        disabled={submitting === "good"}
                        className="flex items-center  gap-2 px-3 py-1.5 rounded-full border border-black/5  hover:shadow-sm text-sm hover:bg-black/10 transition-all duration-300"
                      >
                        {submitting === "good" ? (
                          <Loading relative className="!text-neutral-700" />
                        ) : (
                          <SolvedIcon />
                        )}
                        <div className="text-nowrap">It's solved</div>
                      </button>

                      <button
                        onClick={() => handleFeedback("bad")}
                        disabled={submitting === "bad"}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-black/5  hover:shadow-sm text-sm hover:bg-black/10 transition-all duration-300"
                      >
                        {submitting === "bad" ? (
                          <Loading relative className="!text-neutral-700" />
                        ) : (
                          <UnsolvedIcon />
                        )}
                        <div className="text-nowrap">Not solved</div>
                      </button>
                    </>
                  ) : (
                    <FeedbackBadge fb={localFeedback} />
                  )}

                  {isLast && localFeedback === 2 && aiMode && (
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={handleTransferToCS}
                        disabled={submitting === "cs"}
                        className="flex items-center gap-2 px-3 py-1 rounded-full border border-black/5  hover:shadow-sm text-sm hover:bg-black/10 transition-all duration-300"
                      >
                        {submitting === "cs" ? (
                          <Loading relative className="!text-neutral-700" />
                        ) : (
                          <Headset className="size-5" />
                        )}
                        <div className="text-nowrap">
                          Transfer to customer service
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mt-2 text-xs text-rose-600">
                    {typeof error === "string" ? error : "An error occurred."}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default Message;

const SolvedIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke-width="1.5"
    stroke="currentColor"
    className="size-5"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z"
    />
  </svg>
);

const UnsolvedIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="size-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7.498 15.25H4.372c-1.026 0-1.945-.694-2.054-1.715a12.137 12.137 0 0 1-.068-1.285c0-2.848.992-5.464 2.649-7.521C5.287 4.247 5.886 4 6.504 4h4.016a4.5 4.5 0 0 1 1.423.23l3.114 1.04a4.5 4.5 0 0 0 1.423.23h1.294M7.498 15.25c.618 0 .991.724.725 1.282A7.471 7.471 0 0 0 7.5 19.75 2.25 2.25 0 0 0 9.75 22a.75.75 0 0 0 .75-.75v-.633c0-.573.11-1.14.322-1.672.304-.76.93-1.33 1.653-1.715a9.04 9.04 0 0 0 2.86-2.4c.498-.634 1.226-1.08 2.032-1.08h.384m-10.253 1.5H9.7m8.075-9.75c.01.05.027.1.05.148.593 1.2.925 2.55.925 3.977 0 1.487-.36 2.89-.999 4.125m.023-8.25c-.076-.365.183-.75.575-.75h.908c.889 0 1.713.518 1.972 1.368.339 1.11.521 2.287.521 3.507 0 1.553-.295 3.036-.831 4.398-.306.774-1.086 1.227-1.918 1.227h-1.053c-.472 0-.745-.556-.5-.96a8.95 8.95 0 0 0 .303-.54"
    />
  </svg>
);
