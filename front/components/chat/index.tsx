import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  ChevronDown,
  CornerRightUp,
  EllipsisVertical,
  ImageUp,
  MessageSquare,
  X,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import hand from "./assets/hand.png";
import useStorage from "context";
import { get, json, post } from "utils/request";
import avatar from "./assets/avatar.png";
import { Popover, PopoverPanel, PopoverButton } from "@headlessui/react";
import ImageListItem from "./imageItem";
import { compressImage } from "./util";
import Message from "./message-item";
import sound from "./assets/notification.mp3";

const asistanse = {
  name: "Alina",
  avatar,
};

type Msg = { from: string; text: string; meta?: any };

export default function ChatWidget() {
  const {
    setting: { isLoged, token, uuid, landing = true },
    setSetting,
    app: { user },
  } = useStorage();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [emailError, setEmailError] = useState("");
  const [typing, setTyping] = useState(false);
  const [conversion, setConversion] = useState<any | null>(null);

  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [collectedEmail, setCollectedEmail] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");

  useEffect(() => {
    audioRef.current = new Audio(sound);
    audioRef.current.preload = "auto";
    const delay = Math.floor(Math.random() * (10 - 5 + 1) + 5) * 1000;

    const timer = setTimeout(() => {
      if (landing) {
        setSetting({ landing: false });
        setOpen(true);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (open) {
      audioRef.current?.play().catch(() => {
        /* ignore autoplay block */
      });
    }
  }, [open]);

  const scrollToBottom = () => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  };

  const getChatUserId = () => {
    if (isLoged) return user?.id;
    if (uuid) return uuid;
    const _uuid = uuidv4();
    setSetting({ uuid: _uuid });
    return _uuid;
  };

  const endChat = async () => {
    try {
      const uid = getChatUserId();
      const res: any = await get(
        `ai/endchat?uid=${uid}`,
        token ? { token } : {}
      );
      if (res?.success) {
        setConversion(null);
        setMessages([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadConversationHistory = async () => {
    try {
      const uid = getChatUserId();
      const res: any = await get(
        `ai/conversations?uid=${uid}`,
        token ? { token } : {}
      );
      if (res?.success && res.data?.length) {
        const latestConversation = res.data[0];
        setConversion(latestConversation);

        const messagesRes: any = await get(
          `ai/messages/${latestConversation.id}?uid=${uid}`,
          token ? { token } : {}
        );

        if (messagesRes?.success && messagesRes.data) {
          setMessages(messagesRes.data);
        }
      } else {
        setMessages([]);
        setConversion(null);
      }
    } catch (err) {
      console.error("Error loading conversation history", err);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      loadConversationHistory();
    }
  }, [open]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typing, open]);

  /* File selection -> compress -> upload immediately */
  const onFileSelected = async (file?: File) => {
    const selected = file ?? fileInputRef.current?.files?.[0];
    if (!selected) return;

    // show local preview quickly
    const localUrl = URL.createObjectURL(selected);
    setLocalPreview(localUrl);
    setUploading(true);

    try {
      const compressed = await compressImage(selected, 1200, 0.75);

      // prepare form payload; server expects { token, img: compressed }
      const data: any = { token: "test", img: compressed };
      const res: any = await post(
        "https://api.mintland.io/api/user/upload",
        data,
        { file: true }
      );

      if (res?.success) {
        setImageUrl(res?.data?.fileUrl);
      } else {
        setLocalPreview(null);
      }
    } catch (err) {
      console.error("upload error", err);
      setLocalPreview(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = () => {
    if (localPreview) {
      URL.revokeObjectURL(localPreview);
    }
    setLocalPreview(null);
    setImageUrl(null);
  };

  const validateEmail = (e: string) => {
    // simple email regex
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);
  };

  const sendMessage = async () => {
    const text = input.trim();
    const uid = getChatUserId();

    const emailToSend = emailInput;

    if (!text) return;

    setMessages((m) => [
      ...m,
      {
        from: "user",
        text,
        meta: { ...(imageUrl ? { image: imageUrl } : {}) },
      },
    ]);

    setInput("");
    setTyping(true);

    try {
      const payload: any = {
        uid,
        text,
        cId: conversion?.id,
        currentUrl: typeof window !== "undefined" ? window.location.href : null,
      };
      if (emailToSend) payload.email = emailToSend;
      if (imageUrl) payload.image = imageUrl;
      const res: any = await json(`ai/send`, payload, token ? { token } : {});
      setTyping(false);

      if (res?.success) {
        const { conversation, messages: messagesFromServer } = res.data;
        if (conversation?.id) setConversion(conversation);

        // messagesFromServer may be an array or single message — normalize
        if (Array.isArray(messagesFromServer)) {
          setMessages((prev) => [...prev, ...messagesFromServer]);
        } else if (messagesFromServer) {
          setMessages((prev) => [...prev, messagesFromServer]);
        }

        // clear image after successful send
        setImageUrl(null);
        if (localPreview) {
          URL.revokeObjectURL(localPreview);
          setLocalPreview(null);
        }
      }
    } catch (err) {
      setTyping(false);
      console.error(err);
    }
  };
  async function handleSubmitEmail(e?: React.FormEvent) {
    e?.preventDefault();
    setEmailError("");

    const email = emailInput.trim();
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address.");
      // keep input focused for quick correction
      inputRef.current?.focus();
      return;
    }
    setCollectedEmail(email);
  }
  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 20, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => setOpen((v) => !v)}
            className="hidden sm:flex items-center gap-2 fixed bottom-7 right-24 z-[990] select-none bg-white/90 backdrop-blur rounded-full px-4 py-2 shadow-lg border border-black/5"
          >
            <span className="text-sm font-medium text-gray-800">
              Chat with us
            </span>
            <img src={hand} className="size-6" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileTap={{ scale: 0.9 }}
        animate={{
          backgroundImage: open
            ? "linear-gradient(135deg, #333, #333)"
            : "linear-gradient(135deg, #fda4af, #fdba74)", // rose-300 → orange-300
        }}
        className={
          "fixed bottom-5 right-7 z-[990] grid place-items-center w-14 h-14 transition-all duration-300 hover:scale-[1.1] rounded-full " +
          (open ? "text-white" : "text-black")
        }
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="grid place-items-center"
            >
              <X className="w-6 h-6" />
            </motion.span>
          ) : (
            <motion.span
              key="chat"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="grid place-items-center"
            >
              <MessageSquare strokeWidth={1.7} className="w-6 h-6" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.aside
            key="panel"
            className={
              "fixed transform-all duration-100 inset-0 sm:inset-auto sm:bottom-20 sm:right-6 sm:w-96 z-[99999] flex flex-col bg-white text-black shadow-2xl sm:rounded-2xl overflow-hidden " +
              (messages?.length > 0 ? "sm:h-[80vh]" : "sm:h-[50vh]")
            }
            initial={{ y: 48, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 48, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header */}
            <div className="flex items-center justify-between text-black px-4 py-2 bg-gradient-to-r from-rose-200 to-orange-300">
              <div className="flex gap-2 items-center">
                <img
                  src={asistanse.avatar}
                  className="size-10 rounded-full border-[2px] border-white/80 p-0.5"
                />
                <div className="flex flex-col">
                  <span className="">{asistanse.name}</span>
                  {conversion && (
                    <span className="text-xs text-neutral-600">
                      Chat ID: #{conversion.id}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1 items-center">
                <div
                  onClick={() => setOpen((v) => !v)}
                  className="transition-all duration-300 hover:bg-black/10 p-1 rounded-xl"
                >
                  <ChevronDown className="size-7" />
                </div>
                <Popover className="relative">
                  {({ close, open }) => (
                    <>
                      <PopoverButton className="flex items-center outline-none text-sm">
                        <div className="transition-all duration-300 hover:bg-black/10 p-1 rounded-xl">
                          <EllipsisVertical className="h-7" />
                        </div>
                      </PopoverButton>

                      <PopoverPanel
                        transition
                        anchor="bottom end"
                        className="fixed z-[99999] top-full mt-3 min-w-[150px] p-2  w-fit overflow-hidden rounded-xl backdrop-blur-xl bg-white/20 border border-black/20 transition data-[closed]:translate-y-1 data-[closed]:opacity-0 data-[enter]:duration-200 data-[leave]:duration-150 data-[enter]:ease-out data-[leave]:ease-in"
                      >
                        <div
                          onClick={() => {
                            close();
                            endChat();
                          }}
                          className={
                            "transition-all text-sm duration-300 hover:bg-black/5 p-2 rounded-xl  " +
                            (conversion
                              ? "cursor-pointer"
                              : "text-neutral-500 cursor-not-allowed")
                          }
                        >
                          End Conversation
                        </div>
                      </PopoverPanel>
                    </>
                  )}
                </Popover>
              </div>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-x-auto bg-white p-4"
              ref={scrollerRef}
            >
              {messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="flex items-center justify-center h-full"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xl font-semibold">
                        Hi{" "}
                        {isLoged ? (
                          <span className="text-neutral-600">
                            {user?.fullName}
                          </span>
                        ) : (
                          "there"
                        )}
                      </p>
                      <img src={hand} className="size-10 -mt-2" />
                    </div>
                    <p className="text-sm mt-2">
                      Welcome to Timetrade. Ask us anything.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <>
                  {messages.map((m, i) => {
                    const isLast = i === messages.length - 1;
                    return (
                      <Message
                        key={i}
                        conversion={conversion}
                        message={m}
                        isLast={isLast}
                        setMessages={setMessages}
                      />
                    );
                  })}
                </>
              )}

              {/* Typing indicator */}
              <div className="w-full flex justify-start ">
                <AnimatePresence>
                  {typing && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="p-3 bg-black/5 rounded-2xl flex items-center gap-1"
                    >
                      {[0, 0.12, 0.24].map((d, idx) => (
                        <motion.span
                          key={idx}
                          className="w-2 h-2 rounded-full bg-gray-400"
                          animate={{ y: [0, -4, 0] }}
                          transition={{
                            repeat: Infinity,
                            duration: 0.6,
                            delay: d,
                          }}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Input */}
            <div className="flex flex-col items-center gap-2 p-2">
              <div className="w-[90%] mx-auto h-[1px] border-t border-black/5"></div>

              {!collectedEmail && !conversion ? (
                <div className="w-full">
                  <AnimatePresence>
                    <motion.form
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                      onSubmit={handleSubmitEmail}
                      className="w-full mx-auto mb-1 flex flex-col gap-3"
                    >
                      <motion.div
                        layout
                        className="rounded-2xl p-3"
                        // small lift on hover to feel interactive
                        whileHover={{ translateY: -3 }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <label htmlFor="email" className="sr-only">
                              Email address
                            </label>
                            <div className="text-sm text-neutral-700 px-2">
                              {emailError ? (
                                <span className="text-sm text-red-500 px-1">
                                  {emailError}
                                </span>
                              ) : (
                                <span>
                                  Enter your email to continue the chat
                                </span>
                              )}
                            </div>

                            <div className="mt-2 flex gap-2">
                              <input
                                id="email"
                                ref={inputRef}
                                value={emailInput}
                                onChange={(e) => {
                                  setEmailInput(e.target.value);
                                  if (emailError) setEmailError("");
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleSubmitEmail();
                                  }
                                }}
                                placeholder="you@company.com"
                                aria-invalid={!!emailError}
                                aria-describedby={
                                  emailError ? "email-error" : undefined
                                }
                                className={`flex-1 text-black px-4 py-2 text-sm rounded-full focus:outline-none border transition-shadow
                                       ${
                                         emailError
                                           ? "border-red-300 shadow-[0_0_0_4px_rgba(254,202,202,0.12)]"
                                           : "border-black/5"
                                       }`}
                                autoComplete="email"
                                inputMode="email"
                                type="email"
                              />

                              <motion.button
                                type="submit"
                                whileTap={{ scale: 0.98 }}
                                whileHover={{ translateY: -2 }}
                                className="px-4 rounded-full text-white bg-black font-normal shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                onClick={(e) => {
                                  // form handles submission; this ensures button submit works consistently
                                }}
                              >
                                <CornerRightUp />
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </motion.form>
                  </AnimatePresence>
                </div>
              ) : (
                <div className="w-full mx-auto flex items-center gap-3">
                  <div className="flex-1 flex items-center">
                    <div className="flex items-center">
                      <motion.button
                        whileTap={{ scale: 0.94 }}
                        className="grid place-items-center rounded-full text-black w-10 h-10 hover:bg-black/10 transition-all duration-300"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImageUp className="size-5 text-neutral-500" />
                      </motion.button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        onFileSelected(e.target.files?.[0] ?? undefined)
                      }
                    />

                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                      placeholder="Type a message…"
                      className="flex-1 px-2 py-2 text-sm rounded-full focus:outline-none"
                    />

                    <motion.button
                      whileTap={{ scale: 0.94 }}
                      onClick={sendMessage}
                      className="grid place-items-center rounded-full text-black w-10 h-10 hover:bg-black/10 transition-all duration-300"
                    >
                      <ArrowUp className="size-5" />
                    </motion.button>
                  </div>
                </div>
              )}

              {(localPreview || imageUrl) && (
                <div className="mb-4 pt-2 px-3 w-full border-t border-black/5">
                  <ImageListItem
                    imageUrl={imageUrl}
                    localPreview={localPreview}
                    uploading={uploading}
                    onRemove={removeImage}
                  />
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
