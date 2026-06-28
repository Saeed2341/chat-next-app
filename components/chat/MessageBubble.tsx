"use client";

import { BsCheck, BsCheckAll } from "react-icons/bs";
import { HiOutlineClock } from "react-icons/hi";
import { FiMapPin } from "react-icons/fi";
import { useEffect, useState, memo } from "react";

interface Message {
  _id?: string;
  sender: string;
  text: string;
  time?: Date;
  createdAt?: Date;
  status?: "sending" | "sent" | "delivered" | "seen";
  seen?: boolean;
  isPinned?: boolean;
  editedAt?: Date;
  replyTo?: {
    messageId: string;
    text: string;
    sender: string;
  };
}

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  currentUser: string;
  onReplyClick: (message: Message) => void;
  onMessageClick: (message: Message, event: React.MouseEvent) => void;
}

function MessageBubble({
  message,
  isOwnMessage,
  currentUser,
  onReplyClick,
  onMessageClick,
}: MessageBubbleProps) {
  const [shouldAnimate, setShouldAnimate] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShouldAnimate(false), 100);
    return () => clearTimeout(timer);
  }, []);

  const formatTime = (date: any) => {
    if (!date) return "";
    const d = new Date(date);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  const getMessageStatusIcon = (status?: string, seen?: boolean) => {
    if (seen || status === "seen") {
      return <BsCheckAll size={16} className="text-blue-400 font-bold" />;
    }
    switch (status) {
      case "sending":
        return <HiOutlineClock size={14} className="text-gray-400 animate-pulse" />;
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

  return (
    <div
      id={`message-${message._id}`}
      className={`flex ${isOwnMessage ? "justify-start" : "justify-end"} ${
        shouldAnimate ? "animate-fade-in" : ""
      } group`}
      onClick={(e) => onMessageClick(message, e)}
    >
      <div
        className={`relative px-4 py-2 max-w-[75%] break-words cursor-pointer transition hover:brightness-110 shadow-lg ${
          isOwnMessage
            ? "bg-green-500/20 backdrop-blur-sm border border-green-500/20 shadow-green-500/10 rounded-3xl rounded-br-none"
            : "bg-white/10 backdrop-blur-sm border border-white/10 shadow-black/20 rounded-3xl rounded-bl-none"
        } ${message.isPinned ? "ring-2 ring-yellow-500/50" : ""}`}
      >
        {message.isPinned && (
          <div className="absolute -top-2 -right-2">
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
              {message.replyTo.text}
            </div>
          </div>
        )}

        <div className="flex flex-row-reverse flex-wrap items-baseline justify-end gap-x-1 gap-y-0">
          <span className="text-[15px] text-white/90 break-words whitespace-pre-wrap text-right">
            {message.text}
          </span>
          <span className="flex items-center gap-0.5 text-[10px] text-gray-400 leading-none shrink-0">
            <span>{formatTime(message.time || message.createdAt)}</span>
            {isOwnMessage && (
              <span className="inline-flex">
                {getMessageStatusIcon(message.status, message.seen)}
              </span>
            )}
          </span>
        </div>

        {message.editedAt && (
          <div className="text-[10px] text-gray-400 text-left mt-0.5">
            (ویرایش شده)
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(MessageBubble);