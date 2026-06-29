"use client";

import { BsCheck, BsCheckAll } from "react-icons/bs";
import { HiOutlineClock } from "react-icons/hi";
import { FiMapPin } from "react-icons/fi";
import { useRef, useEffect } from "react";
import type { Message } from "@/types";
import ImageMessage from "@/components/chat/ImageMessage";

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  currentUser: string;
  onReplyClick: (message: Message) => void;
  onMessageClick: (message: Message, event: React.MouseEvent) => void;
}

export default function MessageBubble({
  message,
  isOwnMessage,
  currentUser,
  onReplyClick,
  onMessageClick,
}: MessageBubbleProps) {
  const isFirstRender = useRef(true);

  useEffect(() => {
    isFirstRender.current = false;
  }, []);

  const formatTime = (date: unknown) => {
    if (!date) return "";
    const d = new Date(date as string | Date);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  const getMessageStatusIcon = (status?: string, seen?: boolean) => {
    if (seen || status === "seen") {
      return <BsCheckAll size={16} className="text-blue-400 font-bold" />;
    }
    switch (status) {
      case "sending":
        return (
          <HiOutlineClock size={14} className="text-gray-400 animate-pulse" />
        );
      case "sent":
        return <BsCheck size={16} className="text-gray-300 font-bold" />;
      case "delivered":
        return <BsCheckAll size={16} className="text-gray-300 font-bold" />;
      default:
        return null;
    }
  };

  const scrollToRepliedMessage = (messageId: string) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("highlight-message");
      setTimeout(() => element.classList.remove("highlight-message"), 2000);
    }
  };

  const hasImage = message.attachment?.type === "image" && message.attachment.url;

  const handleBubbleClick = (e: React.MouseEvent) => {
    if (hasImage && (e.target as HTMLElement).closest("[data-image-message]")) {
      return;
    }
    onMessageClick(message, e);
  };

  return (
    <div
      id={`message-${message._id}`}
      className={`flex ${isOwnMessage ? "justify-start" : "justify-end"} ${
        isFirstRender.current ? "animate-fade-in" : ""
      } group`}
      onClick={handleBubbleClick}
    >
      <div
        className={`relative px-3 py-2 break-words cursor-pointer transition hover:brightness-110 shadow-lg ${
          hasImage ? "max-w-[85%] p-1.5" : "max-w-[75%]"
        } ${
          isOwnMessage
            ? "bg-green-500/20 backdrop-blur-sm border border-green-500/20 shadow-green-500/10 rounded-3xl rounded-br-none"
            : "bg-white/10 backdrop-blur-sm border border-white/10 shadow-black/20 rounded-3xl rounded-bl-none"
        } ${message.isPinned ? "ring-2 ring-yellow-500/50" : ""} ${hasImage ? "overflow-hidden" : ""}`}
      >
        {message.isPinned && (
          <div className="absolute -top-2 -right-2 z-10">
            <FiMapPin size={12} className="text-yellow-500 rotate-45" />
          </div>
        )}

        {message.replyTo && message.replyTo.messageId && (
          <div
            className={`mb-1 pb-1 pr-2 cursor-pointer hover:opacity-80 transition ${
              isOwnMessage
                ? "border-r-2 border-r-green-400"
                : "border-r-2 border-r-green-600"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              scrollToRepliedMessage(message.replyTo!.messageId);
            }}
          >
            <div className="text-xs text-green-400 font-bold">
              {message.replyTo.sender === currentUser
                ? "پاسخ به خودتان"
                : `پاسخ به ${message.replyTo.sender}`}
            </div>
            <div className="text-xs text-gray-400 truncate max-w-[200px]">
              {message.replyTo.text || "📷 عکس"}
            </div>
          </div>
        )}

        {hasImage && (
          <div className="mb-1 -mx-1" data-image-message>
            <ImageMessage
              attachment={message.attachment!}
              messageId={message._id}
              isOwnMessage={isOwnMessage}
            />
          </div>
        )}

        {(message.text || !hasImage) && (
          <div className="flex flex-row-reverse flex-wrap items-baseline justify-end gap-x-1 gap-y-0 px-1">
            {message.text && (
              <span className="text-[15px] text-white/90 break-words whitespace-pre-wrap text-right">
                {message.text}
              </span>
            )}

            <span className=" flex items-center gap-0.5 text-[10px] text-gray-400 leading-none shrink-0">
              <span>{formatTime(message.time || message.createdAt)}</span>
              {isOwnMessage && (
                <span className="inline-flex">
                  {getMessageStatusIcon(message.status, message.seen)}
                </span>
              )}
            </span>
          </div>
        )}

        {hasImage && !message.text && (
          <div className="flex items-center justify-end gap-0.5 text-[10px] text-gray-400 px-1 mt-0.5">
            <span>{formatTime(message.time || message.createdAt)}</span>
            {isOwnMessage && (
              <span className="inline-flex">
                {getMessageStatusIcon(message.status, message.seen)}
              </span>
            )}
          </div>
        )}

        {message.editedAt && (
          <div className="text-[10px] text-gray-400 text-left mt-0.5 px-1">
            (ویرایش شده)
          </div>
        )}
      </div>
    </div>
  );
}
